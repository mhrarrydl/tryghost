import { MiddlewareConsumer, Module } from '@nestjs/common';

import { UserController } from './http/controllers/user.controller';
import { IUserRepository } from './ghost/user/user.repository';
import { UserRepositoryImpl } from './db/user.repository.impl';
import { LoggerMiddleware } from './logger/logger.middleware';
import {LazyModuleLoader} from '@nestjs/core';

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
            async useFactory(lazyModuleLoader: LazyModuleLoader) {
                console.log('Loading UserService via factory');
                const module = await lazyModuleLoader.load(async () => {
                    const {Services} = await import('./services.module');
                    return Services;
                });
                const {UserService} = await import('./ghost/user/user.service');
                return module.get(UserService);
            },
            inject: [LazyModuleLoader]
        },
    ],
    exports: []
};
