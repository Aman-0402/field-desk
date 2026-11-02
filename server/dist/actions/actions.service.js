var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ForbiddenException } from '@nestjs/common';
import { randomUUID, createHash } from 'node:crypto';
import { BUSINESS_TERMS_VERSION, COMMAND_RULES } from '@crm/shared/crm';
import { UsersRepository } from '../users/users.repository.js';
import { ActionsRepository } from '../actions/actions.repository.js';
import { OrdersRepository } from '../orders/orders.repository.js';
import { CustomersRepository } from '../customers/customers.repository.js';
import { CustomersService } from '../customers/customers.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { FulfillmentService } from '../fulfillment/fulfillment.service.js';
import { ReturnsService } from '../returns/returns.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { RewardsService } from '../rewards/rewards.service.js';
import { CreditsService } from '../credits/credits.service.js';
import { AuditRepository } from '../audit/audit.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { DatabaseService } from '../database/database.service.js';
import { authorize, useOrder, useCustomer, fail, DomainFailure as Failure, DomainDecision as Decision, } from '../common/domain.js';
function stable(value) {
    if (Array.isArray(value))
        return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object')
        return `{${Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
            .join(',')}}`;
    return JSON.stringify(value);
}
let ActionsService = class ActionsService {
    usersRepository;
    actionsRepository;
    ordersRepository;
    customersRepository;
    customersService;
    ordersService;
    fulfillmentService;
    returnsService;
    accountsService;
    rewardsService;
    creditsService;
    auditRepository;
    auditService;
    database;
    constructor(usersRepository, actionsRepository, ordersRepository, customersRepository, customersService, ordersService, fulfillmentService, returnsService, accountsService, rewardsService, creditsService, auditRepository, auditService, database) {
        this.usersRepository = usersRepository;
        this.actionsRepository = actionsRepository;
        this.ordersRepository = ordersRepository;
        this.customersRepository = customersRepository;
        this.customersService = customersService;
        this.ordersService = ordersService;
        this.fulfillmentService = fulfillmentService;
        this.returnsService = returnsService;
        this.accountsService = accountsService;
        this.rewardsService = rewardsService;
        this.creditsService = creditsService;
        this.auditRepository = auditRepository;
        this.auditService = auditService;
        this.database = database;
    }
    execute(envelope, requester) {
        return this.database.db.transaction(() => {
            const actorId = envelope.actorId ?? requester.id;
            if (actorId !== requester.id && requester.role !== 'ADMIN')
                throw new ForbiddenException('You cannot submit actions as another staff member');
            const row = this.usersRepository.findById(actorId);
            if (!row?.active)
                throw new ForbiddenException('The staff account is inactive or missing');
            const actor = row;
            const fingerprint = createHash('sha256')
                .update(stable({
                command: envelope.command,
                actorId,
                expectedVersion: envelope.expectedVersion,
            }))
                .digest('hex');
            const previous = this.actionsRepository.findRequest(requester.id, envelope.idempotencyKey);
            if (previous) {
                if (previous.fingerprint === fingerprint)
                    return JSON.parse(previous.result);
                return {
                    status: 'CONFLICT',
                    actionId: '',
                    errors: [
                        {
                            code: 'IDEMPOTENCY_CONFLICT',
                            message: 'This request key has already been used for different input',
                        },
                    ],
                    decisions: [],
                    effects: [],
                    trace: [],
                    aggregateVersions: {},
                    references: {},
                    termsVersion: BUSINESS_TERMS_VERSION,
                };
            }
            const c = {
                id: randomUUID(),
                actor,
                requester,
                now: new Date().toISOString(),
                customerId: '',
                touched: new Set(),
                effects: [],
                references: {},
                command: envelope.command,
            };
            const result = {
                status: 'APPLIED',
                actionId: c.id,
                errors: [],
                decisions: [],
                effects: c.effects,
                trace: [],
                aggregateVersions: {},
                references: c.references,
                termsVersion: BUSINESS_TERMS_VERSION,
            };
            try {
                this.database.db.transaction(() => {
                    const p = envelope.command.payload;
                    const aggregate = 'orderId' in p
                        ? useOrder(c, this.ordersRepository.findById(p.orderId))
                        : useCustomer(c, this.customersRepository.findById(p.customerId));
                    if (envelope.command.type !== 'PUNCH_ORDER' &&
                        envelope.expectedVersion === undefined)
                        fail('VERSION_REQUIRED', 'Refresh the record and include its version');
                    if (envelope.expectedVersion !== undefined &&
                        envelope.expectedVersion !== aggregate.version)
                        fail('VERSION_CONFLICT', 'The record changed. Refresh and try again.');
                    result.trace.push({
                        stage: 'request',
                        explanation: `${actor.name} (${actor.role}) requested ${envelope.command.type} against version ${aggregate.version}. Business terms ${BUSINESS_TERMS_VERSION}.`,
                    });
                    const rule = COMMAND_RULES[envelope.command.type];
                    authorize(c, ...rule.roles);
                    switch (envelope.command.type) {
                        case 'UPDATE_CUSTOMER':
                            this.customersService.updateCustomer(c, envelope.command.payload);
                            break;
                        case 'PUNCH_ORDER':
                            this.ordersService.punch(c, envelope.command.payload);
                            break;
                        case 'EDIT_ORDER':
                            this.ordersService.edit(c, envelope.command.payload);
                            break;
                        case 'SUBMIT_ORDER':
                            this.ordersService.submit(c, envelope.command.payload);
                            break;
                        case 'APPROVE_ORDER':
                            this.ordersService.approve(c, envelope.command.payload);
                            break;
                        case 'REJECT_ORDER':
                            this.ordersService.reject(c, envelope.command.payload);
                            break;
                        case 'START_LOADING':
                            this.fulfillmentService.load(c, envelope.command.payload);
                            break;
                        case 'DISPATCH_SHIPMENT':
                            this.fulfillmentService.dispatch(c, envelope.command.payload);
                            break;
                        case 'CONFIRM_DELIVERY':
                            this.fulfillmentService.deliver(c, envelope.command.payload);
                            break;
                        case 'CANCEL_REMAINDER':
                            this.ordersService.cancel(c, envelope.command.payload);
                            break;
                        case 'RECORD_RETURN':
                            this.returnsService.returnItems(c, envelope.command.payload);
                            break;
                        case 'RECEIVE_CUSTOMER_PAYMENT':
                            this.accountsService.receive(c, envelope.command.payload);
                            break;
                        case 'ALLOCATE_PAYMENT':
                            this.accountsService.allocate(c, envelope.command.payload);
                            break;
                        case 'REDEEM_POINTS':
                            this.rewardsService.redeem(c, envelope.command.payload);
                            break;
                        case 'ISSUE_CREDIT_NOTE':
                            this.creditsService.issueCredit(c, envelope.command.payload);
                            break;
                        case 'APPLY_CREDIT_NOTE':
                            this.creditsService.applyCredit(c, envelope.command.payload);
                            break;
                        case 'REFUND_CREDIT_NOTE':
                            this.creditsService.refundCredit(c, envelope.command.payload);
                            break;
                        case 'REVERSE_CREDIT_APPLICATION':
                            this.creditsService.reverseCreditApplication(c, envelope.command.payload);
                            break;
                        case 'REVERSE_CREDIT_REFUND':
                            this.creditsService.reverseCreditRefund(c, envelope.command.payload);
                            break;
                        case 'CORRECT_DISPATCHED_ORDER':
                            this.fulfillmentService.correct(c, envelope.command.payload);
                            break;
                        case 'CORRECT_DELIVERY':
                            this.fulfillmentService.correctDelivery(c, envelope.command.payload);
                            break;
                        case 'MOVE_PAYMENT':
                            this.accountsService.movePayment(c, envelope.command.payload);
                            break;
                    }
                    // WF-002: commands that move cash or goods value recompute cash
                    // allocation and reward points for every customer they touched.
                    if (rule.reconciles)
                        for (const customerId of c.touched)
                            this.reconcile(c, customerId);
                    for (const customerId of c.touched) {
                        this.customersRepository.updateCustomer(c, customerId, {
                            version: this.customersRepository.findById(customerId).version + 1,
                        });
                        for (const order of this.ordersRepository.forCustomer(customerId))
                            this.ordersRepository.updateOrder(c, order.id, {
                                version: order.version + 1,
                            });
                        result.aggregateVersions[customerId] =
                            this.customersRepository.findById(customerId).version;
                        for (const order of this.ordersRepository.forCustomer(customerId))
                            result.aggregateVersions[order.id] = order.version;
                        this.auditRepository.insertEvent(c, {
                            id: randomUUID(),
                            customer_id: customerId,
                            order_id: customerId === c.customerId ? (c.orderId ?? null) : null,
                            actor_id: actor.id,
                            actor_name: actor.name,
                            requested_by: requester.id,
                            action_id: c.id,
                            type: envelope.command.type,
                            payload: JSON.stringify(envelope.command.payload),
                            occurred_at: c.now,
                        });
                    }
                    result.review = this.auditService.review(c.customerId);
                    const failedChecks = [...c.touched].flatMap((customerId) => (customerId === c.customerId
                        ? result.review
                        : this.auditService.review(customerId)).checks.filter((check) => !check.passed));
                    if (failedChecks.length)
                        fail('ACCOUNT_INCONSISTENT', failedChecks.map((check) => check.label).join('; '));
                    this.auditService.enrich(c);
                    result.trace.push(...c.effects
                        .filter((effect) => effect.reason)
                        .map((effect) => ({
                        stage: effect.entity,
                        explanation: effect.reason,
                    })));
                    result.trace.push({
                        stage: 'completed',
                        explanation: `${envelope.command.type} completed by ${actor.name}. ${c.effects.length} records written.`,
                    });
                });
            }
            catch (error) {
                c.effects.length = 0;
                result.aggregateVersions = {};
                result.references = {};
                result.review = undefined;
                result.trace = [];
                if (error instanceof Decision) {
                    result.status = 'NEEDS_DECISION';
                    result.decisions = error.decisions;
                }
                else if (error instanceof Failure) {
                    result.status = error.code.includes('CONFLICT')
                        ? 'CONFLICT'
                        : 'REJECTED';
                    result.errors = [{ code: error.code, message: error.message }];
                }
                else
                    throw error;
                result.trace.push({
                    stage: 'not_applied',
                    explanation: error.message,
                });
            }
            this.actionsRepository.saveRequest({
                id: c.id,
                requester_id: requester.id,
                actor_id: actor.id,
                idempotency_key: envelope.idempotencyKey,
                fingerprint: fingerprint,
                result: JSON.stringify(result),
                created_at: c.now,
            });
            return result;
        }, { behavior: 'immediate' });
    }
    /** ACC-003 then REW-002/003 for one customer, restoring the primary customer. */
    reconcile(c, customerId) {
        const primary = c.customerId;
        c.customerId = customerId;
        this.accountsService.allocateCash(c);
        this.rewardsService.refresh(c);
        c.customerId = primary;
    }
};
ActionsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UsersRepository,
        ActionsRepository,
        OrdersRepository,
        CustomersRepository,
        CustomersService,
        OrdersService,
        FulfillmentService,
        ReturnsService,
        AccountsService,
        RewardsService,
        CreditsService,
        AuditRepository,
        AuditService,
        DatabaseService])
], ActionsService);
export { ActionsService };
//# sourceMappingURL=actions.service.js.map