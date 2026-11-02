import { createParamDecorator, SetMetadata } from '@nestjs/common';
export const PUBLIC_ROUTE = 'auth:public';
export const ALLOWED_ROLES = 'auth:roles';
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
export const Roles = (...roles) => SetMetadata(ALLOWED_ROLES, roles);
export const CurrentUser = createParamDecorator((_data, context) => context.switchToHttp().getRequest().user);
//# sourceMappingURL=auth.decorators.js.map