import { Injectable, CanActivate, ExecutionContext, Inject } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {Roles} from "../decorators/roles.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(@Inject(Reflector) private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const roles = this.reflector.get(Roles, context.getHandler());
        const request = context.switchToHttp().getRequest();
        if (roles.includes(request.user?.role)) {
            return true;
        }
        return false;
    }
}
