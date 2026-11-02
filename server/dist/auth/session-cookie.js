export const SESSION_COOKIE = 'crm_session';
export function cookieOptions(config) {
    return {
        httpOnly: true,
        secure: config.get('NODE_ENV', { infer: true }) === 'production',
        sameSite: 'strict',
        path: '/api',
    };
}
//# sourceMappingURL=session-cookie.js.map