import { z } from 'zod';
export declare const roleSchema: z.ZodEnum<{
    SALES: "SALES";
    KAM: "KAM";
    WAREHOUSE: "WAREHOUSE";
    ACCOUNTS: "ACCOUNTS";
    ADMIN: "ADMIN";
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strict>;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strict>;
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<{
        SALES: "SALES";
        KAM: "KAM";
        WAREHOUSE: "WAREHOUSE";
        ACCOUNTS: "ACCOUNTS";
        ADMIN: "ADMIN";
    }>;
}, z.core.$strict>;
export declare const updateUserSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<{
        SALES: "SALES";
        KAM: "KAM";
        WAREHOUSE: "WAREHOUSE";
        ACCOUNTS: "ACCOUNTS";
        ADMIN: "ADMIN";
    }>>;
    active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const listUsersSchema: z.ZodObject<{
    search: z.ZodDefault<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strict>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;
