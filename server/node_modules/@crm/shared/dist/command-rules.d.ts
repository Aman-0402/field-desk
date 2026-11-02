import type { Role } from './roles.js';
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
export declare const COMMAND_RULES: {
    readonly UPDATE_CUSTOMER: {
        readonly summary: "Change customer name or code";
        readonly roles: readonly ["SALES", "ACCOUNTS"];
        readonly reconciles: false;
        readonly rules: readonly ["CUS-001"];
    };
    readonly PUNCH_ORDER: {
        readonly summary: "Create a draft order";
        readonly roles: readonly ["SALES"];
        readonly reconciles: false;
        readonly rules: readonly ["ORD-005", "CAT-002"];
    };
    readonly EDIT_ORDER: {
        readonly summary: "Replace commercial terms with a new revision";
        readonly roles: readonly ["SALES"];
        readonly reconciles: false;
        readonly rules: readonly ["ORD-003", "ORD-005", "ORD-006"];
    };
    readonly SUBMIT_ORDER: {
        readonly summary: "Submit a revision for review";
        readonly roles: readonly ["SALES"];
        readonly reconciles: false;
        readonly rules: readonly ["ORD-005"];
    };
    readonly APPROVE_ORDER: {
        readonly summary: "Approve the current revision";
        readonly roles: readonly ["KAM"];
        readonly reconciles: false;
        readonly rules: readonly ["ORD-005", "REW-001"];
    };
    readonly REJECT_ORDER: {
        readonly summary: "Reject the current revision";
        readonly roles: readonly ["KAM"];
        readonly reconciles: false;
        readonly rules: readonly ["ORD-005"];
    };
    readonly CANCEL_REMAINDER: {
        readonly summary: "Cancel unshipped demand";
        readonly roles: readonly ["SALES"];
        readonly reconciles: false;
        readonly rules: readonly ["ORD-004", "ORD-005", "ORD-006"];
    };
    readonly START_LOADING: {
        readonly summary: "Reserve units in a loading batch";
        readonly roles: readonly ["WAREHOUSE"];
        readonly reconciles: false;
        readonly rules: readonly ["FUL-003", "FUL-004", "ORD-001"];
    };
    readonly DISPATCH_SHIPMENT: {
        readonly summary: "Confirm a loaded batch left the warehouse";
        readonly roles: readonly ["WAREHOUSE"];
        readonly reconciles: false;
        readonly rules: readonly ["FUL-003", "FUL-005"];
    };
    readonly CONFIRM_DELIVERY: {
        readonly summary: "Confirm dispatched units reached the customer";
        readonly roles: readonly ["WAREHOUSE"];
        readonly reconciles: true;
        readonly rules: readonly ["FUL-001", "FUL-006", "WF-002", "WF-005"];
    };
    readonly RECORD_RETURN: {
        readonly summary: "Receive delivered units back with an explicit deduction";
        readonly roles: readonly ["WAREHOUSE"];
        readonly reconciles: true;
        readonly rules: readonly ["RET-001", "RET-002", "WF-002", "WF-003"];
    };
    readonly CORRECT_DISPATCHED_ORDER: {
        readonly summary: "Record authorized additional dispatched goods";
        readonly roles: readonly ["KAM"];
        readonly reconciles: true;
        readonly rules: readonly ["WF-001", "WF-002", "WF-004"];
    };
    readonly CORRECT_DELIVERY: {
        readonly summary: "Lower an overstated delivery quantity";
        readonly roles: readonly ["KAM"];
        readonly reconciles: true;
        readonly rules: readonly ["FUL-001", "FUL-007", "WF-001", "WF-002", "WF-003", "WF-005"];
    };
    readonly MOVE_PAYMENT: {
        readonly summary: "Move a payment recorded against the wrong customer";
        readonly roles: readonly ["ACCOUNTS"];
        readonly reconciles: true;
        readonly rules: readonly ["CUS-001", "ACC-003", "ACC-004", "WF-001", "WF-002"];
    };
    readonly RECEIVE_CUSTOMER_PAYMENT: {
        readonly summary: "Capture customer cash and allocate it";
        readonly roles: readonly ["ACCOUNTS"];
        readonly reconciles: true;
        readonly rules: readonly ["ACC-002", "ACC-003", "WF-002"];
    };
    readonly ALLOCATE_PAYMENT: {
        readonly summary: "Allocate existing free cash";
        readonly roles: readonly ["ACCOUNTS"];
        readonly reconciles: true;
        readonly rules: readonly ["ACC-003", "WF-002"];
    };
    readonly ISSUE_CREDIT_NOTE: {
        readonly summary: "Reserve free receipt value as credit";
        readonly roles: readonly ["ACCOUNTS"];
        readonly reconciles: false;
        readonly rules: readonly ["CRD-001", "CRD-002", "CRD-006"];
    };
    readonly APPLY_CREDIT_NOTE: {
        readonly summary: "Settle a charge with credit";
        readonly roles: readonly ["ACCOUNTS"];
        readonly reconciles: false;
        readonly rules: readonly ["CUS-001", "CRD-003"];
    };
    readonly REFUND_CREDIT_NOTE: {
        readonly summary: "Record a payout from available credit";
        readonly roles: readonly ["ACCOUNTS"];
        readonly reconciles: false;
        readonly rules: readonly ["CRD-001", "CRD-004"];
    };
    readonly REVERSE_CREDIT_APPLICATION: {
        readonly summary: "Undo part of a credit application";
        readonly roles: readonly ["ACCOUNTS"];
        readonly reconciles: false;
        readonly rules: readonly ["CRD-005", "CRD-006", "WF-001"];
    };
    readonly REVERSE_CREDIT_REFUND: {
        readonly summary: "Undo part of a credit refund";
        readonly roles: readonly ["ACCOUNTS"];
        readonly reconciles: false;
        readonly rules: readonly ["CRD-005", "CRD-006", "WF-001"];
    };
    readonly REDEEM_POINTS: {
        readonly summary: "Settle a charge with available points";
        readonly roles: readonly ["SALES", "ACCOUNTS"];
        readonly reconciles: false;
        readonly rules: readonly ["REW-003", "REW-004"];
    };
};
