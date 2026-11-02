import { z } from 'zod';
import type { User } from './types.js';
export { COMMAND_RULES } from './command-rules.js';
export type { CommandRule } from './command-rules.js';
export declare const crmActionSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"UPDATE_CUSTOMER">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        name: z.ZodString;
        code: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"PUNCH_ORDER">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            skuId: z.ZodString;
            qty: z.ZodNumber;
            unitPricePaise: z.ZodNumber;
        }, z.core.$strict>>;
        reason: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"EDIT_ORDER">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            skuId: z.ZodString;
            qty: z.ZodNumber;
            unitPricePaise: z.ZodNumber;
        }, z.core.$strict>>;
        reason: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"SUBMIT_ORDER">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"APPROVE_ORDER">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        revision: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"REJECT_ORDER">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        revision: z.ZodNumber;
        reason: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"START_LOADING">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            lineKey: z.ZodString;
            qty: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"DISPATCH_SHIPMENT">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        shipmentId: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"CONFIRM_DELIVERY">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        shipmentId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            shipmentLineId: z.ZodString;
            qty: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"CANCEL_REMAINDER">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        reason: z.ZodString;
        items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            lineKey: z.ZodString;
            qty: z.ZodNumber;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"RECORD_RETURN">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            shipmentLineId: z.ZodString;
            qty: z.ZodNumber;
        }, z.core.$strict>>;
        feePaise: z.ZodNumber;
        reason: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"RECEIVE_CUSTOMER_PAYMENT">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        amountPaise: z.ZodNumber;
        reference: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"ALLOCATE_PAYMENT">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"REDEEM_POINTS">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        chargeId: z.ZodString;
        points: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"ISSUE_CREDIT_NOTE">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        amountPaise: z.ZodNumber;
        reason: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"APPLY_CREDIT_NOTE">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        creditNoteId: z.ZodString;
        chargeId: z.ZodString;
        amountPaise: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"REFUND_CREDIT_NOTE">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        creditNoteId: z.ZodString;
        amountPaise: z.ZodNumber;
        reference: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"REVERSE_CREDIT_APPLICATION">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        applicationId: z.ZodString;
        amountPaise: z.ZodNumber;
        reason: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"REVERSE_CREDIT_REFUND">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        refundId: z.ZodString;
        amountPaise: z.ZodNumber;
        reason: z.ZodString;
        reference: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"MOVE_PAYMENT">;
    payload: z.ZodObject<{
        customerId: z.ZodString;
        receiptId: z.ZodString;
        toCustomerId: z.ZodString;
        reason: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"CORRECT_DELIVERY">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        shipmentId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            shipmentLineId: z.ZodString;
            deliveredQty: z.ZodNumber;
        }, z.core.$strict>>;
        reason: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"CORRECT_DISPATCHED_ORDER">;
    payload: z.ZodObject<{
        orderId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            skuId: z.ZodString;
            qty: z.ZodNumber;
            unitPricePaise: z.ZodNumber;
            deliveredQty: z.ZodNumber;
        }, z.core.$strict>>;
        reason: z.ZodString;
        evidence: z.ZodString;
        authorizationReference: z.ZodString;
        location: z.ZodOptional<z.ZodEnum<{
            EXISTING_SHIPMENT: "EXISTING_SHIPMENT";
            NEW_SHIPMENT: "NEW_SHIPMENT";
        }>>;
        shipmentId: z.ZodOptional<z.ZodString>;
        dispatchedAt: z.ZodOptional<z.ZodISODateTime>;
    }, z.core.$strict>;
}, z.core.$strip>], "type">;
export declare const actionEnvelopeSchema: z.ZodObject<{
    command: z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"UPDATE_CUSTOMER">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            name: z.ZodString;
            code: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"PUNCH_ORDER">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            items: z.ZodArray<z.ZodObject<{
                skuId: z.ZodString;
                qty: z.ZodNumber;
                unitPricePaise: z.ZodNumber;
            }, z.core.$strict>>;
            reason: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"EDIT_ORDER">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            items: z.ZodArray<z.ZodObject<{
                skuId: z.ZodString;
                qty: z.ZodNumber;
                unitPricePaise: z.ZodNumber;
            }, z.core.$strict>>;
            reason: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"SUBMIT_ORDER">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"APPROVE_ORDER">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            revision: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"REJECT_ORDER">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            revision: z.ZodNumber;
            reason: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"START_LOADING">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            items: z.ZodArray<z.ZodObject<{
                lineKey: z.ZodString;
                qty: z.ZodNumber;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"DISPATCH_SHIPMENT">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            shipmentId: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"CONFIRM_DELIVERY">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            shipmentId: z.ZodString;
            items: z.ZodArray<z.ZodObject<{
                shipmentLineId: z.ZodString;
                qty: z.ZodNumber;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"CANCEL_REMAINDER">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            reason: z.ZodString;
            items: z.ZodOptional<z.ZodArray<z.ZodObject<{
                lineKey: z.ZodString;
                qty: z.ZodNumber;
            }, z.core.$strict>>>;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"RECORD_RETURN">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            items: z.ZodArray<z.ZodObject<{
                shipmentLineId: z.ZodString;
                qty: z.ZodNumber;
            }, z.core.$strict>>;
            feePaise: z.ZodNumber;
            reason: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"RECEIVE_CUSTOMER_PAYMENT">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            amountPaise: z.ZodNumber;
            reference: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"ALLOCATE_PAYMENT">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"REDEEM_POINTS">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            chargeId: z.ZodString;
            points: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"ISSUE_CREDIT_NOTE">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            amountPaise: z.ZodNumber;
            reason: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"APPLY_CREDIT_NOTE">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            creditNoteId: z.ZodString;
            chargeId: z.ZodString;
            amountPaise: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"REFUND_CREDIT_NOTE">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            creditNoteId: z.ZodString;
            amountPaise: z.ZodNumber;
            reference: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"REVERSE_CREDIT_APPLICATION">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            applicationId: z.ZodString;
            amountPaise: z.ZodNumber;
            reason: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"REVERSE_CREDIT_REFUND">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            refundId: z.ZodString;
            amountPaise: z.ZodNumber;
            reason: z.ZodString;
            reference: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"MOVE_PAYMENT">;
        payload: z.ZodObject<{
            customerId: z.ZodString;
            receiptId: z.ZodString;
            toCustomerId: z.ZodString;
            reason: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"CORRECT_DELIVERY">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            shipmentId: z.ZodString;
            items: z.ZodArray<z.ZodObject<{
                shipmentLineId: z.ZodString;
                deliveredQty: z.ZodNumber;
            }, z.core.$strict>>;
            reason: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"CORRECT_DISPATCHED_ORDER">;
        payload: z.ZodObject<{
            orderId: z.ZodString;
            items: z.ZodArray<z.ZodObject<{
                skuId: z.ZodString;
                qty: z.ZodNumber;
                unitPricePaise: z.ZodNumber;
                deliveredQty: z.ZodNumber;
            }, z.core.$strict>>;
            reason: z.ZodString;
            evidence: z.ZodString;
            authorizationReference: z.ZodString;
            location: z.ZodOptional<z.ZodEnum<{
                EXISTING_SHIPMENT: "EXISTING_SHIPMENT";
                NEW_SHIPMENT: "NEW_SHIPMENT";
            }>>;
            shipmentId: z.ZodOptional<z.ZodString>;
            dispatchedAt: z.ZodOptional<z.ZodISODateTime>;
        }, z.core.$strict>;
    }, z.core.$strip>], "type">;
    actorId: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodString;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type CrmCommand = z.infer<typeof crmActionSchema>;
export type ActionEnvelope = z.infer<typeof actionEnvelopeSchema>;
export type CommandType = CrmCommand['type'];
export declare const BUSINESS_TERMS_VERSION = "2026-10-26.1";
export interface AccountCheck {
    id: string;
    label: string;
    passed: boolean;
    details: string;
    references: string[];
}
export interface AccountReview {
    customerId: string;
    customerVersion: number;
    termsVersion: string;
    checkedAt: string;
    checks: AccountCheck[];
}
export interface CustomerSnapshot {
    summary: CustomerSummary;
    orders: OrderDetail[];
    ledger: LedgerView;
    timeline: EventRow[];
    review: AccountReview;
}
export interface ActionResult {
    status: 'APPLIED' | 'REJECTED' | 'NEEDS_DECISION' | 'CONFLICT';
    actionId: string;
    errors: Array<{
        code: string;
        message: string;
    }>;
    decisions: Array<{
        key: string;
        prompt: string;
        options: Array<{
            id: string;
            label: string;
        }>;
    }>;
    effects: Array<{
        entity: string;
        operation: 'INSERT' | 'UPDATE' | 'APPEND';
        before?: unknown;
        after?: unknown;
        reason?: string;
        sourceReference?: string;
        provenance?: {
            actionId: string;
            actorId: string;
            requestedBy: string;
            orderId?: string;
            revision?: number;
            shipmentId?: string;
            lineKey?: string;
        };
    }>;
    trace: Array<{
        stage: string;
        explanation: string;
    }>;
    aggregateVersions: Record<string, number>;
    references: Record<string, string>;
    termsVersion?: string;
    review?: AccountReview;
}
export interface Customer {
    id: string;
    code: string;
    name: string;
    version: number;
}
export interface CustomerAccountRow {
    customer: Customer;
    netBalancePaise: number;
    outstandingPaise: number;
    unappliedCashPaise: number;
    creditsOpenPaise: number;
}
export interface Sku {
    id: string;
    code: string;
    name: string;
    price_paise: number;
    points_per_unit: number;
}
export interface OrderListRow {
    id: string;
    number: string;
    customer_id: string;
    status: string;
    current_revision: number;
    version: number;
    created_at: string;
    totalPaise?: number;
    fulfillmentStatus?: 'UNFULFILLED' | 'LOADING' | 'PARTIALLY_DISPATCHED' | 'DISPATCHED' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'CANCELLED';
}
export interface OrderLine {
    lineKey: string;
    skuId: string;
    code: string;
    name: string;
    qty: number;
    approved: number;
    unitPricePaise: number;
    canceled: number;
    loaded: number;
    dispatched: number;
    delivered: number;
    returned: number;
    open: number;
}
export interface ShipmentLine {
    id: string;
    line_key: string;
    sku_id: string;
    loaded_qty: number;
    dispatched_qty: number;
    unit_price_paise: number;
    delivered: number;
    returned: number;
}
export interface Shipment {
    id: string;
    status: string;
    revision: number;
    dispatched_at: string | null;
    original_shipment_id: string | null;
    lines: ShipmentLine[];
}
export interface EventRow {
    id: string;
    action_id: string;
    customer_id: string;
    order_id: string | null;
    actor_id: string;
    actor_name: string;
    requested_by: string;
    type: string;
    payload: string;
    occurred_at: string;
}
export interface OrderDetail {
    order: OrderListRow;
    lines: OrderLine[];
    shipments: Shipment[];
    revisions: Array<{
        id: string;
        revision: number;
        reason: string;
        actor_id: string;
        created_at: string;
        lines: Array<{
            sku_id: string;
            qty: number;
            unit_price_paise: number;
        }>;
    }>;
    approvals: Array<{
        id: string;
        revision: number;
        decision: string;
        actor_id: string;
        reason: string;
    }>;
    timeline: EventRow[];
}
export interface Charge {
    id: string;
    order_id: string;
    line_key: string | null;
    amount_paise: number;
    remainingPaise: number;
    outstandingPaise: number;
    cashPaidPaise: number;
    kind: string;
    created_at: string;
}
export interface CreditNote {
    id: string;
    amount_paise: number;
    availablePaise: number;
    appliedPaise: number;
    refundedPaise: number;
    reason: string;
}
export interface CustomerSummary {
    customer: Customer;
    netBalancePaise: number;
    outstandingPaise: number;
    unappliedCashPaise: number;
    receivedPaise: number;
    creditsOpenPaise: number;
    refundsPaise: number;
    points: {
        locked: number;
        available: number;
        redeemed: number;
        clawbackPending: number;
    };
    charges: Charge[];
    credits: CreditNote[];
}
export interface LedgerView {
    finance: Array<Record<string, unknown>>;
    receipts: Array<Record<string, unknown>>;
    allocations: Array<Record<string, unknown>>;
    creditApplications: Array<Record<string, unknown>>;
    credits: Array<Record<string, unknown>>;
    refunds: Array<Record<string, unknown>>;
    redemptions: Array<Record<string, unknown>>;
    rewards: Array<Record<string, unknown>>;
    returns: Array<Record<string, unknown>>;
    corrections: Array<Record<string, unknown>>;
}
export interface CrmBootstrap {
    customers: Customer[];
    skus: Sku[];
    orders: OrderListRow[];
    actors: User[];
}
