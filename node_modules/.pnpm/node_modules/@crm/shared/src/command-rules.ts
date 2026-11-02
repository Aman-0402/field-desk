import type { Role } from './roles.js';
import type { CommandType } from './crm.js';

/**
 * One row per command: who may run it, whether it moves cash or goods value so
 * that cash allocation and reward points must be recomputed (WF-002), and which
 * canonical rules govern it. Admin may run every command.
 *
 * The action shell reads this table; services no longer check roles or call
 * reconcile themselves. Read it as a summary of the business rules, and read
 * `docs/candidate-walkthrough/canonical_business_rules.md` for the details.
 */
export interface CommandRule {
  /** What the command does, in business words. */
  summary: string;
  /** Roles allowed besides Admin. */
  roles: readonly Role[];
  /** True when WF-002 applies: allocate free cash, then refresh reward points. */
  reconciles: boolean;
  /** Canonical rule IDs that govern the command. */
  rules: readonly string[];
}

export const COMMAND_RULES = {
  UPDATE_CUSTOMER: {
    summary: 'Change customer name or code',
    roles: ['SALES', 'ACCOUNTS'],
    reconciles: false,
    rules: ['CUS-001'],
  },
  PUNCH_ORDER: {
    summary: 'Create a draft order',
    roles: ['SALES'],
    reconciles: false,
    rules: ['ORD-005', 'CAT-002'],
  },
  EDIT_ORDER: {
    summary: 'Replace commercial terms with a new revision',
    roles: ['SALES'],
    reconciles: false,
    rules: ['ORD-003', 'ORD-005', 'ORD-006'],
  },
  SUBMIT_ORDER: {
    summary: 'Submit a revision for review',
    roles: ['SALES'],
    reconciles: false,
    rules: ['ORD-005'],
  },
  APPROVE_ORDER: {
    summary: 'Approve the current revision',
    roles: ['KAM'],
    reconciles: false,
    rules: ['ORD-005', 'REW-001'],
  },
  REJECT_ORDER: {
    summary: 'Reject the current revision',
    roles: ['KAM'],
    reconciles: false,
    rules: ['ORD-005'],
  },
  CANCEL_REMAINDER: {
    summary: 'Cancel unshipped demand',
    roles: ['SALES'],
    reconciles: false,
    rules: ['ORD-004', 'ORD-005', 'ORD-006'],
  },
  START_LOADING: {
    summary: 'Reserve units in a loading batch',
    roles: ['WAREHOUSE'],
    reconciles: false,
    rules: ['FUL-003', 'FUL-004', 'ORD-001'],
  },
  DISPATCH_SHIPMENT: {
    summary: 'Confirm a loaded batch left the warehouse',
    roles: ['WAREHOUSE'],
    reconciles: false,
    rules: ['FUL-003', 'FUL-005'],
  },
  CONFIRM_DELIVERY: {
    summary: 'Confirm dispatched units reached the customer',
    roles: ['WAREHOUSE'],
    reconciles: true,
    rules: ['FUL-001', 'FUL-006', 'WF-002', 'WF-005'],
  },
  RECORD_RETURN: {
    summary: 'Receive delivered units back with an explicit deduction',
    roles: ['WAREHOUSE'],
    reconciles: true,
    rules: ['RET-001', 'RET-002', 'WF-002', 'WF-003'],
  },
  CORRECT_DISPATCHED_ORDER: {
    summary: 'Record authorized additional dispatched goods',
    roles: ['KAM'],
    reconciles: true,
    rules: ['WF-001', 'WF-002', 'WF-004'],
  },
  CORRECT_DELIVERY: {
    summary: 'Lower an overstated delivery quantity',
    roles: ['KAM'],
    reconciles: true,
    rules: ['FUL-001', 'FUL-007', 'WF-001', 'WF-002', 'WF-003', 'WF-005'],
  },
  MOVE_PAYMENT: {
    summary: 'Move a payment recorded against the wrong customer',
    roles: ['ACCOUNTS'],
    reconciles: true,
    rules: ['CUS-001', 'ACC-003', 'ACC-004', 'WF-001', 'WF-002'],
  },
  RECEIVE_CUSTOMER_PAYMENT: {
    summary: 'Capture customer cash and allocate it',
    roles: ['ACCOUNTS'],
    reconciles: true,
    rules: ['ACC-002', 'ACC-003', 'WF-002'],
  },
  ALLOCATE_PAYMENT: {
    summary: 'Allocate existing free cash',
    roles: ['ACCOUNTS'],
    reconciles: true,
    rules: ['ACC-003', 'WF-002'],
  },
  ISSUE_CREDIT_NOTE: {
    summary: 'Reserve free receipt value as credit',
    roles: ['ACCOUNTS'],
    reconciles: false,
    rules: ['CRD-001', 'CRD-002', 'CRD-006'],
  },
  APPLY_CREDIT_NOTE: {
    summary: 'Settle a charge with credit',
    roles: ['ACCOUNTS'],
    reconciles: false,
    rules: ['CUS-001', 'CRD-003'],
  },
  REFUND_CREDIT_NOTE: {
    summary: 'Record a payout from available credit',
    roles: ['ACCOUNTS'],
    reconciles: false,
    rules: ['CRD-001', 'CRD-004'],
  },
  REVERSE_CREDIT_APPLICATION: {
    summary: 'Undo part of a credit application',
    roles: ['ACCOUNTS'],
    reconciles: false,
    rules: ['CRD-005', 'CRD-006', 'WF-001'],
  },
  REVERSE_CREDIT_REFUND: {
    summary: 'Undo part of a credit refund',
    roles: ['ACCOUNTS'],
    reconciles: false,
    rules: ['CRD-005', 'CRD-006', 'WF-001'],
  },
  REDEEM_POINTS: {
    summary: 'Settle a charge with available points',
    roles: ['SALES', 'ACCOUNTS'],
    reconciles: false,
    rules: ['REW-003', 'REW-004'],
  },
} as const satisfies Record<CommandType, CommandRule>;
