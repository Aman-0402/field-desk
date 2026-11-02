export declare const ROLES: readonly ["SALES", "KAM", "WAREHOUSE", "ACCOUNTS", "ADMIN"];
export type Role = (typeof ROLES)[number];
export declare const ROLE_LABELS: Record<Role, string>;
export declare function canAccess(role: Role, area: 'users' | 'sales' | 'accounts'): boolean;
