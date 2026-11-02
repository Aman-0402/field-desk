import { ChargeBalance } from './accounts.model.js';
import { CreditBalance } from '../credits/credits.model.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CustomerSummary,
  LedgerView,
  CustomerAccountRow,
} from '@crm/shared/crm';
import { CustomersRepository } from '../customers/customers.repository.js';
import { AccountsRepository } from '../accounts/accounts.repository.js';
import { RewardsService } from '../rewards/rewards.service.js';
import { CreditsRepository } from '../credits/credits.repository.js';
import { RewardsRepository } from '../rewards/rewards.repository.js';
import { ReturnsRepository } from '../returns/returns.repository.js';
import { FulfillmentRepository } from '../fulfillment/fulfillment.repository.js';
import { DatabaseService } from '../database/database.service.js';
import type { ActionContext as Context, Payload } from '../common/domain.js';
import { useCustomer, fail, safe } from '../common/domain.js';

@Injectable()
export class AccountsService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly rewardsService: RewardsService,
    private readonly creditsRepository: CreditsRepository,
    private readonly rewardsRepository: RewardsRepository,
    private readonly returnsRepository: ReturnsRepository,
    private readonly fulfillmentRepository: FulfillmentRepository,
    private readonly database: DatabaseService,
  ) {}
  receive(c: Context, p: Payload<'RECEIVE_CUSTOMER_PAYMENT'>) {
    useCustomer(c, this.customersRepository.findById(p.customerId));
    const receiptId = randomUUID();
    c.references.receiptId = receiptId;
    this.accountsRepository.insertReceipt(c, {
      id: receiptId,
      customer_id: c.customerId,
      amount_paise: p.amountPaise,
      reference: p.reference,
      action_id: c.id,
      created_at: c.now,
    });
  }
  allocate(c: Context, p: Payload<'ALLOCATE_PAYMENT'>) {
    useCustomer(c, this.customersRepository.findById(p.customerId));
  }
  allocateCash(c: Context) {
    for (const receipt of this.accountsRepository.receiptsForCustomer(
      c.customerId,
    )) {
      let available =
        receipt.amount_paise -
        this.accountsRepository.allocatedFromReceipt(receipt.id) -
        this.creditsRepository.reservedFromReceipt(receipt.id);
      if (available < 0)
        fail('RECEIPT_MISMATCH', 'Receipt allocations exceed captured funds');
      for (const charge of this.accountsRepository.chargesInDueOrder(
        c.customerId,
      )) {
        if (!available) break;
        const face =
          charge.amount_paise +
          this.accountsRepository.adjustmentsForCharge(charge.id);
        const cash = this.accountsRepository.cashForCharge(charge.id);
        const credit = this.creditsRepository.appliedToCharge(charge.id);
        const redeemed = this.rewardsRepository.redeemedForCharge(charge.id);
        const take = Math.min(
          available,
          Math.max(0, face - cash - credit - redeemed),
        );
        if (take)
          this.accountsRepository.insertAllocation(c, {
            id: randomUUID(),
            customer_id: c.customerId,
            receipt_id: receipt.id,
            charge_id: charge.id,
            amount_paise: take,
            action_id: c.id,
            created_at: c.now,
          });
        available -= take;
      }
    }
  }
  /**
   * ACC-004 (FDSK-169). Move a receipt recorded against the wrong customer.
   * The original receipt and the cash it settled are never edited: its
   * allocations are released with negative rows, a reversal row retires the
   * receipt, and an identical receipt (same amount, reference and time
   * received) is recorded on the right customer. The shell then reconciles
   * both customers, so the old customer's charges reopen and the new
   * customer's cash is allocated under ACC-003.
   */
  movePayment(c: Context, p: Payload<'MOVE_PAYMENT'>) {
    useCustomer(c, this.customersRepository.findById(p.customerId));
    const receipt = this.accountsRepository.findLiveReceipt(
      p.receiptId,
      c.customerId,
    );
    if (!receipt)
      fail(
        'RECEIPT_NOT_FOUND',
        'Select a receipt recorded against this customer',
      );
    if (p.toCustomerId === c.customerId)
      fail(
        'SAME_CUSTOMER',
        'Choose a different customer to move the payment to',
      );
    const target = this.customersRepository.findById(p.toCustomerId);
    if (!target) fail('NOT_FOUND', 'Customer not found');
    c.touched.add(target.id);
    if (this.creditsRepository.reservedFromReceipt(receipt.id))
      fail(
        'RECEIPT_FUNDS_CREDIT',
        'This payment funds a credit note, so it cannot be moved',
      );
    for (const settled of this.accountsRepository.allocatedByCharge(receipt.id))
      this.accountsRepository.insertAllocation(c, {
        id: randomUUID(),
        customer_id: c.customerId,
        receipt_id: receipt.id,
        charge_id: settled.charge_id,
        amount_paise: -settled.n,
        action_id: c.id,
        created_at: c.now,
      });
    const replacementId = randomUUID();
    c.references.receiptId = replacementId;
    c.references.reversedReceiptId = receipt.id;
    this.accountsRepository.insertReceipt(c, {
      id: replacementId,
      customer_id: target.id,
      amount_paise: receipt.amount_paise,
      reference: receipt.reference,
      moved_from_receipt_id: receipt.id,
      action_id: c.id,
      created_at: receipt.created_at,
    });
    this.accountsRepository.insertReceiptReversal(c, {
      id: randomUUID(),
      receipt_id: receipt.id,
      replacement_receipt_id: replacementId,
      reason: p.reason,
      action_id: c.id,
      created_at: c.now,
    });
  }
  /**
   * WF-003. A charge's retained value has fallen to `newFace`. Release any
   * settlement above it: cash first, then credit, then points. Cash and credit
   * are taken from the most recently settled source first, and every released
   * amount is restored to its original source. Released cash per receipt is
   * accumulated in `released`, in the order sources were first met.
   */
  releaseSettlement(
    c: Context,
    charge: { id: string },
    newFace: number,
    sourceId: string,
    released: Map<string, number>,
  ) {
    const cash = this.accountsRepository.cashForCharge(charge.id);
    const credits = this.creditsRepository.appliedToCharge(charge.id);
    const rewards = this.rewardsRepository.redeemedForCharge(charge.id);
    let overage = Math.max(0, cash + credits + rewards - newFace);
    for (const allocation of this.accountsRepository.cashByReceiptForCharge(
      charge.id,
    )) {
      const take = Math.min(overage, allocation.n);
      if (!take) continue;
      this.accountsRepository.insertAllocation(c, {
        id: randomUUID(),
        customer_id: c.customerId,
        receipt_id: allocation.receipt_id,
        charge_id: charge.id,
        amount_paise: -take,
        action_id: c.id,
        created_at: c.now,
      });
      released.set(
        allocation.receipt_id,
        (released.get(allocation.receipt_id) ?? 0) + take,
      );
      overage -= take;
    }
    for (const application of this.creditsRepository.creditByNoteForCharge(
      charge.id,
    )) {
      const take = Math.min(overage, application.n);
      if (!take) continue;
      this.creditsRepository.insertApplication(c, {
        id: randomUUID(),
        customer_id: c.customerId,
        credit_note_id: application.credit_note_id,
        charge_id: charge.id,
        amount_paise: -take,
        action_id: c.id,
        created_at: c.now,
      });
      overage -= take;
    }
    if (overage > 0) {
      if (overage > rewards)
        fail(
          'SETTLEMENT_MISMATCH',
          'The settlement cannot be released against its source documents',
        );
      this.rewardsRepository.insertRedemption(c, {
        id: randomUUID(),
        customer_id: c.customerId,
        charge_id: charge.id,
        points: -overage,
        action_id: c.id,
        created_at: c.now,
      });
      this.rewardsRepository.insertPosting(c, {
        id: randomUUID(),
        customer_id: c.customerId,
        line_key: null,
        bucket: 'AVAILABLE',
        points_delta: overage,
        source_id: sourceId,
        action_id: c.id,
        created_at: c.now,
      });
      this.rewardsRepository.insertPosting(c, {
        id: randomUUID(),
        customer_id: c.customerId,
        line_key: null,
        bucket: 'REDEEMED',
        points_delta: -overage,
        source_id: sourceId,
        action_id: c.id,
        created_at: c.now,
      });
    }
  }
  summary(customerId: string): CustomerSummary {
    const customer = this.customersRepository.findById(customerId);
    if (!customer) throw new NotFoundException('Customer not found');
    const charges = this.accountsRepository
      .chargesForCustomer(customerId)
      .map((charge) => {
        const remainingPaise =
          charge.amount_paise +
          this.accountsRepository.adjustmentsForCharge(charge.id);
        const cashPaidPaise = this.accountsRepository.cashForCharge(charge.id);
        const credit = this.creditsRepository.appliedToCharge(charge.id);
        const redeemed = this.rewardsRepository.redeemedForCharge(charge.id);
        return {
          ...charge,
          remainingPaise,
          cashPaidPaise,
          outstandingPaise: new ChargeBalance(
            remainingPaise,
            cashPaidPaise,
            credit,
            redeemed,
          ).outstandingPaise,
        };
      });
    const credits = this.creditsRepository
      .creditsForCustomer(customerId)
      .map((note) => {
        const appliedPaise = this.creditsRepository.appliedFromCredit(note.id);
        const refundedPaise = this.creditsRepository.refundedFromCredit(
          note.id,
        );
        return {
          ...note,
          appliedPaise,
          refundedPaise,
          availablePaise: new CreditBalance(
            note.amount_paise,
            appliedPaise,
            refundedPaise,
          ).availablePaise,
        };
      });
    const receipts =
      this.accountsRepository.liveReceiptsByInsertion(customerId);
    const unappliedCashPaise = safe(
      receipts.reduce(
        (sum, receipt) =>
          sum +
          receipt.amount_paise -
          this.accountsRepository.allocatedFromReceipt(receipt.id) -
          this.creditsRepository.reservedFromReceipt(receipt.id),
        0,
      ),
    );
    const receivedPaise =
      this.accountsRepository.receivedForCustomer(customerId);
    const refundsPaise = this.creditsRepository.refundedForCustomer(customerId);
    const redemption = this.rewardsRepository.redeemedForCustomer(customerId);
    const netBalancePaise = safe(
      this.accountsRepository.postedForCustomer(customerId) -
        receivedPaise +
        refundsPaise -
        redemption,
    );
    return {
      customer,
      charges,
      credits,
      netBalancePaise,
      unappliedCashPaise,
      receivedPaise,
      refundsPaise,
      outstandingPaise: safe(
        charges.reduce((sum, row) => sum + row.outstandingPaise, 0),
      ),
      creditsOpenPaise: safe(
        credits.reduce((sum, row) => sum + row.availablePaise, 0),
      ),
      points: this.rewardsService.balances(customerId),
    };
  }
  ledger(customerId: string): LedgerView {
    this.summary(customerId);
    return {
      finance: this.accountsRepository.entriesForCustomer(customerId),
      receipts: this.accountsRepository.receiptsByInsertion(customerId),
      allocations: this.accountsRepository.allocationsForCustomer(customerId),
      creditApplications:
        this.creditsRepository.applicationsForCustomer(customerId),
      credits: this.creditsRepository.creditsForCustomer(customerId),
      refunds: this.creditsRepository.refundsForCustomer(customerId),
      redemptions: this.rewardsRepository.redemptionsForCustomer(customerId),
      rewards: this.rewardsRepository.entriesForCustomer(customerId),
      returns: this.returnsRepository.forCustomer(customerId),
      corrections:
        this.fulfillmentRepository.correctionsForCustomer(customerId),
    };
  }
  accounts(): CustomerAccountRow[] {
    return this.database.db.transaction(() =>
      this.customersRepository.list().map((customer) => {
        const summary = this.summary(customer.id);
        return {
          customer,
          netBalancePaise: summary.netBalancePaise,
          outstandingPaise: summary.outstandingPaise,
          unappliedCashPaise: summary.unappliedCashPaise,
          creditsOpenPaise: summary.creditsOpenPaise,
        };
      }),
    );
  }
}
