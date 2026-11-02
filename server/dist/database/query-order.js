import { sql } from 'drizzle-orm';
export function insertionOrder(table) {
    return sql `${table}.rowid`;
}
//# sourceMappingURL=query-order.js.map