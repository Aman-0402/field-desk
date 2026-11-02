export const ROLES = [
    'SALES',
    'KAM',
    'WAREHOUSE',
    'ACCOUNTS',
    'ADMIN',
];
export const ROLE_LABELS = {
    SALES: 'Sales',
    KAM: 'Key Account Manager',
    ADMIN: 'Admin',
    WAREHOUSE: 'Warehouse Manager',
    ACCOUNTS: 'Accounts',
};
export function canAccess(role, area) {
    return (role === 'ADMIN' ||
        (area === 'sales' && role === 'SALES') ||
        (area === 'accounts' && role === 'KAM'));
}
