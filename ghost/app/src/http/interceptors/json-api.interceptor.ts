import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export type Response<Data, PropertyName extends string> = {
    [K in PropertyName]: Data;
} & {
    meta?: any
}

@Injectable()
export class JsonApiInterceptor<T, K extends string> implements NestInterceptor<T, Response<T, K>> {
    constructor(private key: K) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<Response<T, K>> {
        const request = context.switchToHttp().getRequest();
        request.body = request.body?.[this.key];
        console.log('Mapped body');
        console.log(request.body);

        return next.handle().pipe(map((data) => {
            console.log('Mapping output');
            console.log(data);
            const meta = data.meta;
            delete data.meta;
            const result = {
                [this.key]: data.data
            } as Response<T, K>;

            if (meta) {
                result.meta = meta;
            }

            console.log(result);

            return result;
        }));
    }
}
