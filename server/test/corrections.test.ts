import 'reflect-metadata';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { Test } from '@nestjs/testing';
import { getOptionsToken } from '@nestjs/throttler';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { Role } from '@crm/shared';
import {
  COMMAND_RULES,
  crmActionSchema,
  type ActionResult,
  type CrmCommand,
  type CustomerSnapshot,
  type OrderDetail,
} from '@crm/shared/crm';
import { DatabaseService } from '../src/database/database.service.js';
import { UsersService } from '../src/users/users.service.js';
import { configureApp } from '../src/configure-app.js';
import { seedReferenceData } from '../src/scripts/seed-reference-data.js';
import { HttpDesk } from './support/http-desk.js';

const directory = mkdtempSync(join(tmpdir(), 'corrections-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = join(directory, 'corrections.db');
process.env.JWT_SECRET = 'corrections-test-secret-'.repeat(4);
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

// SKU-A: 10,000 paise and 1,000 points per unit, so cash c earns floor(c / 10).
const UNIT = 10000;
const skuA = (qty: number) => [{ skuId: 'sku-a', qty, unitPricePaise: UNIT }];

describe('Corrections: FDSK-169 and FDSK-170', { concurrency: false }, () => {
  let app: INestApplication;
  let desk: HttpDesk;

  before(async () => {
    const { AppModule } = await import('../src/app.module.js');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getOptionsToken())
      .useValue([{ ttl: 60000, limit: 100000 }])
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    migrate(app.get(DatabaseService).db, {
      migrationsFolder: resolve('drizzle'),
    });
    const password = 'corrections-admin-password';
    const admin = await app.get(UsersService).create({
      name: 'Corrections operator',
      email: 'corrections@example.test',
      password,
      role: 'ADMIN',
    });
    seedReferenceData(app.get(DatabaseService), admin);
    await app.init();
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: admin.email, password })
      .expect(200);
    const headers = login.headers['set-cookie'] as unknown as string[];
    desk = new HttpDesk(app, headers[0]!.split(';')[0]!);
  });
  after(async () => {
    if (app) await app.close();
    rmSync(directory, { recursive: true, force: true });
  });

  // ---- helpers ------------------------------------------------------------
  const order = (id: string) => desk.read<OrderDetail>(`orders/${id}`);
  const firstLine = async (orderId: string) => {
    const detail = await order(orderId);
    return {
      detail,
      shipment: detail.shipments[0]!,
      line: detail.shipments[0]!.lines[0]!,
    };
  };
  const allChecksPass = (snapshot: CustomerSnapshot) =>
    assert.ok(
      snapshot.review.checks.every((check) => check.passed),
      JSON.stringify(snapshot.review.checks.filter((check) => !check.passed)),
    );
  const receiptsOf = async (customerId: string) =>
    (await desk.snapshot(customerId)).ledger.receipts as Array<{
      id: string;
      amount_paise: number;
      reference: string;
      reversed_at: string | null;
      moved_from_receipt_id: string | null;
    }>;
  const movePayment = (
    customerId: string,
    receiptId: string,
    toCustomerId: string,
  ): CrmCommand => ({
    type: 'MOVE_PAYMENT',
    payload: {
      customerId,
      receiptId,
      toCustomerId,
      reason: 'Bank reference shows the other customer paid',
    },
  });
  const correctDelivery = (
    orderId: string,
    shipmentId: string,
    shipmentLineId: string,
    deliveredQty: number,
  ): CrmCommand => ({
    type: 'CORRECT_DELIVERY',
    payload: {
      orderId,
      shipmentId,
      items: [{ shipmentLineId, deliveredQty }],
      reason: 'Only part of the consignment reached the customer',
    },
  });
  async function rejected(
    command: CrmCommand,
    role: Role,
    watch: string,
    code: string,
  ) {
    const result = await desk.assertUnchanged(
      await desk.envelope(command, role),
      watch,
      'REJECTED',
    );
    assert.equal(result.errors[0]?.code, code, JSON.stringify(result.errors));
    return result;
  }

  // ---- rules table --------------------------------------------------------
  it('declares a rule row for every command and exactly the WF-002 reconcilers', () => {
    const commands = crmActionSchema.options.map(
      (option) => option.shape.type.value,
    );
    assert.deepEqual(Object.keys(COMMAND_RULES).sort(), [...commands].sort());
    assert.deepEqual(
      Object.entries(COMMAND_RULES)
        .filter(([, rule]) => rule.reconciles)
        .map(([name]) => name)
        .sort(),
      [
        'ALLOCATE_PAYMENT',
        'CONFIRM_DELIVERY',
        'CORRECT_DELIVERY',
        'CORRECT_DISPATCHED_ORDER',
        'MOVE_PAYMENT',
        'RECEIVE_CUSTOMER_PAYMENT',
        'RECORD_RETURN',
      ],
    );
  });

  // ---- FDSK-170: correct an overstated delivery ---------------------------
  describe('FDSK-170 correct an overstated delivery', () => {
    it('lowers 10 delivered to 6, frees the cash, and settles the late 4 from it', async () => {
      const customer = await desk.createCustomer();
      const orderId = await desk.order(customer.id, skuA(10));
      await desk.ship(orderId, [10]); // all ten marked delivered
      await desk.receive(customer.id, 100000);
      let state = await desk.snapshot(customer.id);
      assert.equal(state.summary.points.available, 10000);
      const { shipment, line } = await firstLine(orderId);
      assert.equal(line.delivered, 10);

      const result = await desk.apply(
        correctDelivery(orderId, shipment.id, line.id, 6),
        'KAM',
      );

      state = await desk.snapshot(customer.id);
      allChecksPass(state);
      const after = await firstLine(orderId);
      assert.equal(after.line.delivered, 6);
      assert.equal(after.shipment.status, 'DISPATCHED');
      assert.equal(state.summary.charges.length, 1);
      assert.equal(state.summary.charges[0]!.remainingPaise, 60000);
      assert.equal(state.summary.charges[0]!.cashPaidPaise, 60000);
      assert.equal(state.summary.outstandingPaise, 0);
      assert.equal(state.summary.unappliedCashPaise, 40000);
      assert.deepEqual(
        [state.summary.points.available, state.summary.points.locked],
        [6000, 4000],
      );
      assert.ok(
        result.effects.some((effect) => effect.entity === 'deliveries'),
      );

      // Warehouse confirms the other four; the freed cash pays for them (WF-002).
      await desk.apply(
        {
          type: 'CONFIRM_DELIVERY',
          payload: {
            orderId,
            shipmentId: shipment.id,
            items: [{ shipmentLineId: line.id, qty: 4 }],
          },
        },
        'WAREHOUSE',
      );
      state = await desk.snapshot(customer.id);
      allChecksPass(state);
      assert.equal((await firstLine(orderId)).shipment.status, 'DELIVERED');
      assert.equal(state.summary.outstandingPaise, 0);
      assert.equal(state.summary.unappliedCashPaise, 0);
      assert.deepEqual(
        [state.summary.points.available, state.summary.points.locked],
        [10000, 0],
      );
    });

    it('reduces what the customer owes when nothing was paid yet', async () => {
      const customer = await desk.createCustomer();
      const orderId = await desk.order(customer.id, skuA(10));
      await desk.ship(orderId, [10]);
      const { shipment, line } = await firstLine(orderId);
      await desk.apply(
        correctDelivery(orderId, shipment.id, line.id, 6),
        'KAM',
      );
      const state = await desk.snapshot(customer.id);
      allChecksPass(state);
      assert.equal(state.summary.outstandingPaise, 60000);
      assert.equal(state.summary.netBalancePaise, 60000);
    });

    it('releases only the cash above the reduced charge on a part-paid order', async () => {
      const customer = await desk.createCustomer();
      const orderId = await desk.order(customer.id, skuA(10));
      await desk.ship(orderId, [10]);
      await desk.receive(customer.id, 80000);
      const { shipment, line } = await firstLine(orderId);
      await desk.apply(
        correctDelivery(orderId, shipment.id, line.id, 6),
        'KAM',
      );
      const state = await desk.snapshot(customer.id);
      allChecksPass(state);
      assert.equal(state.summary.charges[0]!.cashPaidPaise, 60000);
      assert.equal(state.summary.unappliedCashPaise, 20000);
      assert.equal(state.summary.outstandingPaise, 0);
    });

    it('reverses the most recent confirmations first across several deliveries', async () => {
      const customer = await desk.createCustomer();
      const orderId = await desk.order(customer.id, skuA(10));
      await desk.ship(orderId, [10], [6]); // 6 confirmed with the dispatch
      const { shipment, line } = await firstLine(orderId);
      await desk.apply(
        {
          type: 'CONFIRM_DELIVERY',
          payload: {
            orderId,
            shipmentId: shipment.id,
            items: [{ shipmentLineId: line.id, qty: 4 }],
          },
        },
        'WAREHOUSE',
      );
      const result = await desk.apply(
        correctDelivery(orderId, shipment.id, line.id, 5),
        'KAM',
      );
      const reversals = result.effects
        .filter((effect) => effect.entity === 'deliveries')
        .map((effect) => (effect.after as { qty: number }).qty);
      assert.deepEqual(reversals, [-4, -1]);
      const state = await desk.snapshot(customer.id);
      allChecksPass(state);
      assert.equal(state.summary.outstandingPaise, 50000);
      assert.equal((await firstLine(orderId)).line.delivered, 5);
    });

    it('allows a correction down to the returned units and no lower', async () => {
      const customer = await desk.createCustomer();
      const orderId = await desk.order(customer.id, skuA(10));
      await desk.ship(orderId, [10]);
      const { shipment, line } = await firstLine(orderId);
      await desk.apply(
        {
          type: 'RECORD_RETURN',
          payload: {
            orderId,
            items: [{ shipmentLineId: line.id, qty: 3 }],
            feePaise: 0,
            reason: 'Customer returned three boxes',
          },
        },
        'WAREHOUSE',
      );
      await rejected(
        correctDelivery(orderId, shipment.id, line.id, 2),
        'KAM',
        customer.id,
        'BELOW_RETURNED',
      );
      await desk.apply(
        correctDelivery(orderId, shipment.id, line.id, 3),
        'KAM',
      );
      const state = await desk.snapshot(customer.id);
      allChecksPass(state);
      assert.equal(state.summary.outstandingPaise, 0);
      assert.equal(
        state.summary.charges.every((c) => c.remainingPaise === 0),
        true,
      );
    });

    it('rejects raising a delivery, wrong roles, and shipments that never dispatched', async () => {
      const customer = await desk.createCustomer();
      const orderId = await desk.order(customer.id, skuA(10));
      await desk.ship(orderId, [10]);
      const { shipment, line } = await firstLine(orderId);
      for (const qty of [10, 11])
        await rejected(
          correctDelivery(orderId, shipment.id, line.id, qty),
          'KAM',
          customer.id,
          'NOT_AN_OVERSTATEMENT',
        );
      for (const role of ['WAREHOUSE', 'SALES', 'ACCOUNTS'] as const)
        await rejected(
          correctDelivery(orderId, shipment.id, line.id, 6),
          role,
          customer.id,
          'FORBIDDEN',
        );

      const loading = await desk.order(customer.id, skuA(5));
      const started = await desk.apply(
        {
          type: 'START_LOADING',
          payload: {
            orderId: loading,
            items: [
              { lineKey: (await order(loading)).lines[0]!.lineKey, qty: 5 },
            ],
          },
        },
        'WAREHOUSE',
      );
      await rejected(
        correctDelivery(loading, started.references.shipmentId!, 'unknown', 1),
        'KAM',
        customer.id,
        'SHIPMENT_STATE',
      );
    });
  });

  // ---- FDSK-169: move a payment to the right customer ---------------------
  describe('FDSK-169 move a payment recorded against the wrong customer', () => {
    async function twoCustomers(qtyEach = 100) {
      const northside = await desk.createCustomer();
      const greenfield = await desk.createCustomer();
      for (const customer of [northside, greenfield]) {
        const orderId = await desk.order(customer.id, skuA(qtyEach));
        await desk.ship(orderId, [qtyEach]);
      }
      return { northside, greenfield };
    }

    it('moves Greenfield’s 10,000 rupees off Northside and settles Greenfield’s charges', async () => {
      const { northside, greenfield } = await twoCustomers();
      await desk.receive(northside.id, 1000000); // the mistake
      let a = await desk.snapshot(northside.id);
      assert.equal(a.summary.outstandingPaise, 0);
      assert.equal(a.summary.points.available, 100000);
      const [original] = await receiptsOf(northside.id);

      const result = await desk.apply(
        movePayment(northside.id, original!.id, greenfield.id),
        'ACCOUNTS',
      );
      assert.ok(result.aggregateVersions[northside.id] !== undefined);
      assert.ok(result.aggregateVersions[greenfield.id] !== undefined);

      a = await desk.snapshot(northside.id);
      const g = await desk.snapshot(greenfield.id);
      allChecksPass(a);
      allChecksPass(g);
      // Northside: charges reopen, the cash and its points are gone.
      assert.equal(a.summary.outstandingPaise, 1000000);
      assert.equal(a.summary.receivedPaise, 0);
      assert.equal(a.summary.unappliedCashPaise, 0);
      assert.deepEqual(
        [a.summary.points.available, a.summary.points.locked],
        [0, 100000],
      );
      // Greenfield: the same cash now settles its charge and earns the points.
      assert.equal(g.summary.outstandingPaise, 0);
      assert.equal(g.summary.receivedPaise, 1000000);
      assert.equal(g.summary.points.available, 100000);
      // History is kept: the original receipt is marked reversed, not deleted.
      const [kept] = await receiptsOf(northside.id);
      assert.equal(kept!.id, original!.id);
      assert.ok(kept!.reversed_at);
      const [moved] = await receiptsOf(greenfield.id);
      assert.equal(moved!.moved_from_receipt_id, original!.id);
      assert.equal(moved!.reference, original!.reference);
      assert.equal(moved!.amount_paise, 1000000);
    });

    it('re-settles reopened charges from the old customer’s other free cash (ACC-003)', async () => {
      const northside = await desk.createCustomer();
      const greenfield = await desk.createCustomer();
      const orderId = await desk.order(northside.id, skuA(100));
      await desk.ship(orderId, [100]);
      await desk.receive(northside.id, 600000); // wrong customer
      await desk.receive(northside.id, 700000); // rightly Northside's
      let a = await desk.snapshot(northside.id);
      assert.equal(a.summary.unappliedCashPaise, 300000);
      const [wrong] = await receiptsOf(northside.id);

      await desk.apply(
        movePayment(northside.id, wrong!.id, greenfield.id),
        'ACCOUNTS',
      );

      a = await desk.snapshot(northside.id);
      const g = await desk.snapshot(greenfield.id);
      allChecksPass(a);
      allChecksPass(g);
      assert.equal(a.summary.unappliedCashPaise, 0);
      assert.equal(a.summary.outstandingPaise, 300000);
      assert.equal(a.summary.receivedPaise, 700000);
      // Greenfield owes nothing yet, so the money waits as an advance.
      assert.equal(g.summary.unappliedCashPaise, 600000);
      assert.equal(g.summary.netBalancePaise, -600000);
    });

    it('turns points already spent from the moved cash into clawback pending', async () => {
      const { northside, greenfield } = await twoCustomers();
      const extra = await desk.order(northside.id, skuA(10));
      await desk.ship(extra, [10]);
      await desk.receive(northside.id, 1000000);
      const [original] = await receiptsOf(northside.id);
      const charge = (await desk.snapshot(northside.id)).summary.charges.find(
        (row) => row.order_id === extra,
      )!;
      await desk.apply(
        {
          type: 'REDEEM_POINTS',
          payload: {
            customerId: northside.id,
            chargeId: charge.id,
            points: 50000,
          },
        },
        'ACCOUNTS',
      );

      await desk.apply(
        movePayment(northside.id, original!.id, greenfield.id),
        'ACCOUNTS',
      );

      const a = await desk.snapshot(northside.id);
      allChecksPass(a);
      assert.equal(a.summary.points.available, 0);
      assert.equal(a.summary.points.clawbackPending, 50000);
      assert.equal(a.summary.points.redeemed, 50000);
      const g = await desk.snapshot(greenfield.id);
      allChecksPass(g);
      assert.equal(g.summary.points.available, 100000);
    });

    it('can move a payment back, and never moves a reversed receipt again', async () => {
      const { northside, greenfield } = await twoCustomers(10);
      await desk.receive(northside.id, 100000);
      const [original] = await receiptsOf(northside.id);
      await desk.apply(
        movePayment(northside.id, original!.id, greenfield.id),
        'ACCOUNTS',
      );
      const [replacement] = await receiptsOf(greenfield.id);
      await desk.apply(
        movePayment(greenfield.id, replacement!.id, northside.id),
        'ACCOUNTS',
      );

      const a = await desk.snapshot(northside.id);
      const g = await desk.snapshot(greenfield.id);
      allChecksPass(a);
      allChecksPass(g);
      assert.equal(a.summary.outstandingPaise, 0);
      assert.equal(g.summary.outstandingPaise, 100000);
      await rejected(
        movePayment(northside.id, original!.id, greenfield.id),
        'ACCOUNTS',
        northside.id,
        'RECEIPT_NOT_FOUND',
      );
    });

    it('rejects bad moves without changing either account', async () => {
      const { northside, greenfield } = await twoCustomers(10);
      await desk.receive(northside.id, 100000);
      await desk.receive(greenfield.id, 5000);
      const [mine] = await receiptsOf(northside.id);
      const [theirs] = await receiptsOf(greenfield.id);
      await rejected(
        movePayment(northside.id, mine!.id, northside.id),
        'ACCOUNTS',
        northside.id,
        'SAME_CUSTOMER',
      );
      await rejected(
        movePayment(northside.id, theirs!.id, greenfield.id),
        'ACCOUNTS',
        northside.id,
        'RECEIPT_NOT_FOUND',
      );
      await rejected(
        movePayment(northside.id, mine!.id, 'no-such-customer'),
        'ACCOUNTS',
        northside.id,
        'NOT_FOUND',
      );
      for (const role of ['KAM', 'WAREHOUSE', 'SALES'] as const)
        await rejected(
          movePayment(northside.id, mine!.id, greenfield.id),
          role,
          northside.id,
          'FORBIDDEN',
        );
    });

    it('refuses to move a payment that funds a credit note (CRD-001)', async () => {
      const northside = await desk.createCustomer();
      const greenfield = await desk.createCustomer();
      await desk.receive(northside.id, 50000);
      await desk.apply(
        {
          type: 'ISSUE_CREDIT_NOTE',
          payload: {
            customerId: northside.id,
            amountPaise: 20000,
            reason: 'Customer asked for credit',
          },
        },
        'ACCOUNTS',
      );
      const [funding] = await receiptsOf(northside.id);
      await rejected(
        movePayment(northside.id, funding!.id, greenfield.id),
        'ACCOUNTS',
        northside.id,
        'RECEIPT_FUNDS_CREDIT',
      );
    });

    it('keeps one audit event per customer and a replayed request idempotent', async () => {
      const { northside, greenfield } = await twoCustomers(10);
      await desk.receive(northside.id, 100000);
      const [original] = await receiptsOf(northside.id);
      const envelope = await desk.envelope(
        movePayment(northside.id, original!.id, greenfield.id),
        'ACCOUNTS',
      );
      const first = await desk.submit(envelope);
      const replay = await desk.submit(envelope);
      assert.equal(first.status, 'APPLIED');
      assert.deepEqual(replay, first as ActionResult);
      for (const customer of [northside, greenfield]) {
        const snapshot = await desk.snapshot(customer.id);
        assert.equal(
          snapshot.timeline.filter(
            (event) => event.action_id === first.actionId,
          ).length,
          1,
        );
      }
    });
  });
});
