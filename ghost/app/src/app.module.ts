import { MiddlewareConsumer, Module } from '@nestjs/common';

import { Injectable, Scope } from '@nestjs/common';
import { UserController } from './http/controllers/user.controller';
import { UserService } from './ghost/user/user.service';
import { UserRepositoryImpl } from './db/user.repository.impl';
import { LoggerMiddleware } from './logger/logger.middleware';

Injectable({ scope: Scope.REQUEST })(UserService);

@Module({
    controllers: [UserController],
    providers: [
        UserService,
        {
            provide: 'UserRepository',
            useClass: UserRepositoryImpl,
        },
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware);
    }
}
