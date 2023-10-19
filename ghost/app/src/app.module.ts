import { MiddlewareConsumer, Module } from '@nestjs/common';

import { UserController } from './http/controllers/user.controller';
import { IUserRepository } from './ghost/user/user.repository';
import { UserRepositoryImpl } from './db/user.repository.impl';
import { LoggerMiddleware } from './logger/logger.middleware';

class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware);
    }
}

export const App = {
    module: AppModule,
    // module: null, // We can pass `null` when we do not need any configuration for the module

    controllers: [UserController],
    providers: [
        {
            provide: 'UserService',
            useFactory(repo: IUserRepository) {
                const {UserService} = require('./ghost/user/user.service');
                return new UserService(repo);
            },
            inject: ['UserRepository']
        },
        {
            provide: 'UserRepository',
            useClass: UserRepositoryImpl,
        },
    ],
};
