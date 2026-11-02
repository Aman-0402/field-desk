import type {
  ActionResult,
  CrmCommand,
  OrderListRow,
  Customer,
} from '@crm/shared/crm';
import type { User, Role } from '@crm/shared';
export type Payload<T extends CrmCommand['type']> = Extract<
  CrmCommand,
  { type: T }
>['payload'];
export interface ActionContext {
  id: string;
  actor: User;
  requester: User;
  now: string;
  /** The customer the command was addressed to. */
  customerId: string;
  /** Every customer the command reads or changes, primary first (WF-002 runs for each). */
  touched: Set<string>;
  orderId?: string;
  effects: ActionResult['effects'];
  references: Record<string, string>;
  command?: CrmCommand;
}
export class DomainFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export class DomainDecision extends Error {
  constructor(readonly decisions: ActionResult['decisions']) {
    super('Additional shipment information is required');
  }
}
export function fail(code: string, message: string): never {
  throw new DomainFailure(code, message);
}
export function safe(value: number) {
  if (!Number.isSafeInteger(value))
    fail('AMOUNT_RANGE', 'The amount exceeds the supported range');
  return value;
}
export function distinct(ids: string[]) {
  if (new Set(ids).size !== ids.length)
    fail('DUPLICATE_ITEM', 'Submit each line only once');
}
export function authorize(c: ActionContext, ...roles: readonly Role[]) {
  if (c.actor.role !== 'ADMIN' && !roles.includes(c.actor.role))
    fail('FORBIDDEN', 'This operation requires a different role');
}
export function useOrder(c: ActionContext, order: OrderListRow | undefined) {
  if (!order) fail('NOT_FOUND', 'Order not found');
  c.customerId = order.customer_id;
  c.touched.add(order.customer_id);
  c.orderId = order.id;
  return order;
}
export function useCustomer(c: ActionContext, customer: Customer | undefined) {
  if (!customer) fail('NOT_FOUND', 'Customer not found');
  c.customerId = customer.id;
  c.touched.add(customer.id);
  return customer;
}
export function recordInsert(
  c: ActionContext,
  entity: string,
  row: unknown,
  append = false,
) {
  c.effects.push({
    entity,
    operation: append ? 'APPEND' : 'INSERT',
    after: row,
  });
}
export function recordUpdate(
  c: ActionContext,
  entity: string,
  before: unknown,
  after: unknown,
) {
  c.effects.push({ entity, operation: 'UPDATE', before, after });
}
