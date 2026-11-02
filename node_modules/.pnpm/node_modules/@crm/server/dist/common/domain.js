export class DomainFailure extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
export class DomainDecision extends Error {
    decisions;
    constructor(decisions) {
        super('Additional shipment information is required');
        this.decisions = decisions;
    }
}
export function fail(code, message) {
    throw new DomainFailure(code, message);
}
export function safe(value) {
    if (!Number.isSafeInteger(value))
        fail('AMOUNT_RANGE', 'The amount exceeds the supported range');
    return value;
}
export function distinct(ids) {
    if (new Set(ids).size !== ids.length)
        fail('DUPLICATE_ITEM', 'Submit each line only once');
}
export function authorize(c, ...roles) {
    if (c.actor.role !== 'ADMIN' && !roles.includes(c.actor.role))
        fail('FORBIDDEN', 'This operation requires a different role');
}
export function useOrder(c, order) {
    if (!order)
        fail('NOT_FOUND', 'Order not found');
    c.customerId = order.customer_id;
    c.touched.add(order.customer_id);
    c.orderId = order.id;
    return order;
}
export function useCustomer(c, customer) {
    if (!customer)
        fail('NOT_FOUND', 'Customer not found');
    c.customerId = customer.id;
    c.touched.add(customer.id);
    return customer;
}
export function recordInsert(c, entity, row, append = false) {
    c.effects.push({
        entity,
        operation: append ? 'APPEND' : 'INSERT',
        after: row,
    });
}
export function recordUpdate(c, entity, before, after) {
    c.effects.push({ entity, operation: 'UPDATE', before, after });
}
//# sourceMappingURL=domain.js.map