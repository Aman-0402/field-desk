import { z } from 'zod';
export { COMMAND_RULES } from './command-rules.js';
const id = z.string().min(1).max(100);
const quantity = z.number().int().min(1).max(10000);
const amount = z.number().int().min(1).max(1000000000);
const reason = z.string().trim().min(3).max(1000);
const item = z
    .object({ skuId: id, qty: quantity, unitPricePaise: amount })
    .strict();
const lines = z
    .array(item)
    .min(1)
    .max(100)
    .refine((value) => new Set(value.map((line) => line.skuId)).size === value.length, 'Each SKU can appear only once');
const action = (type, payload) => z.object({ type: z.literal(type), payload: z.object(payload).strict() });
export const crmActionSchema = z.discriminatedUnion('type', [
    action('UPDATE_CUSTOMER', {
        customerId: id,
        name: z.string().trim().min(2).max(120),
        code: z.string().trim().min(2).max(40),
    }),
    action('PUNCH_ORDER', {
        customerId: id,
        items: lines,
        reason: reason.optional(),
    }),
    action('EDIT_ORDER', { orderId: id, items: lines, reason }),
    action('SUBMIT_ORDER', { orderId: id }),
    action('APPROVE_ORDER', {
        orderId: id,
        revision: z.number().int().positive(),
    }),
    action('REJECT_ORDER', {
        orderId: id,
        revision: z.number().int().positive(),
        reason,
    }),
    action('START_LOADING', {
        orderId: id,
        items: z
            .array(z.object({ lineKey: id, qty: quantity }).strict())
            .min(1)
            .max(100),
    }),
    action('DISPATCH_SHIPMENT', { orderId: id, shipmentId: id }),
    action('CONFIRM_DELIVERY', {
        orderId: id,
        shipmentId: id,
        items: z
            .array(z.object({ shipmentLineId: id, qty: quantity }).strict())
            .min(1)
            .max(100),
    }),
    action('CANCEL_REMAINDER', {
        orderId: id,
        reason,
        items: z
            .array(z.object({ lineKey: id, qty: quantity }).strict())
            .min(1)
            .max(100)
            .optional(),
    }),
    action('RECORD_RETURN', {
        orderId: id,
        items: z
            .array(z.object({ shipmentLineId: id, qty: quantity }).strict())
            .min(1)
            .max(100),
        feePaise: z.number().int().min(0).max(1000000000),
        reason,
    }),
    action('RECEIVE_CUSTOMER_PAYMENT', {
        customerId: id,
        amountPaise: amount,
        reference: z.string().trim().min(1).max(200),
    }),
    action('ALLOCATE_PAYMENT', { customerId: id }),
    action('REDEEM_POINTS', { customerId: id, chargeId: id, points: amount }),
    action('ISSUE_CREDIT_NOTE', { customerId: id, amountPaise: amount, reason }),
    action('APPLY_CREDIT_NOTE', {
        customerId: id,
        creditNoteId: id,
        chargeId: id,
        amountPaise: amount,
    }),
    action('REFUND_CREDIT_NOTE', {
        customerId: id,
        creditNoteId: id,
        amountPaise: amount,
        reference: reason,
    }),
    action('REVERSE_CREDIT_APPLICATION', {
        customerId: id,
        applicationId: id,
        amountPaise: amount,
        reason,
    }),
    action('REVERSE_CREDIT_REFUND', {
        customerId: id,
        refundId: id,
        amountPaise: amount,
        reason,
        reference: reason,
    }),
    action('MOVE_PAYMENT', {
        customerId: id,
        receiptId: id,
        toCustomerId: id,
        reason,
    }),
    action('CORRECT_DELIVERY', {
        orderId: id,
        shipmentId: id,
        items: z
            .array(z
            .object({
            shipmentLineId: id,
            deliveredQty: z.number().int().min(0).max(10000),
        })
            .strict())
            .min(1)
            .max(100),
        reason,
    }),
    action('CORRECT_DISPATCHED_ORDER', {
        orderId: id,
        items: z
            .array(item.extend({ deliveredQty: z.number().int().min(0).max(10000) }))
            .min(1)
            .max(100),
        reason,
        evidence: z.string().trim().min(8).max(2000),
        authorizationReference: reason,
        location: z.enum(['EXISTING_SHIPMENT', 'NEW_SHIPMENT']).optional(),
        shipmentId: id.optional(),
        dispatchedAt: z.iso.datetime().optional(),
    }),
]);
export const actionEnvelopeSchema = z
    .object({
    command: crmActionSchema,
    actorId: id.optional(),
    idempotencyKey: z.string().min(8).max(120),
    expectedVersion: z.number().int().min(0).optional(),
})
    .strict();
export const BUSINESS_TERMS_VERSION = '2026-10-26.1';
