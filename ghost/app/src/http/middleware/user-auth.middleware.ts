import { Inject, Injectable, NestMiddleware } from "@nestjs/common";

interface SessionService {
    getUserForSession(req: any, res: any): Promise<any | null>
}

@Injectable()
export class UserAuthMiddleware implements NestMiddleware {
    constructor(@Inject('SessionService') private sessionService: SessionService) {}

    async use(req: any, res: any, next: () => void) {
        const user = await this.sessionService.getUserForSession(req, res);
        await user.related('roles').fetch();
        const json = user.toJSON();
        if (user) {
            req.user = {
                id: json.id,
                role: json.roles[0].name
            }
        }
        next();
    }
}
