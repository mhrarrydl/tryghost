import {Inject as NestInject} from '@nestjs/common';

export function Inject(token: string) {
    return function (a: any, b: any, c: any) {
        return NestInject(`${a.name}.${token}`)(a, b, c);
    };
}
