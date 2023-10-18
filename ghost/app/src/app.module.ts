import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './http/controllers/app.controller';
import { AppService } from './ghost/app/app.service';

import { Injectable, Scope } from '@nestjs/common';
import { UserController } from './http/controllers/user.controller';
import { UserService } from './ghost/user/user.service';
import { UserRepositoryImpl } from './db/user.repository.impl';
import { LoggerMiddleware } from './logger/logger.middleware';

Injectable({ scope: Scope.REQUEST })(AppService);
Injectable({ scope: Scope.REQUEST })(UserService);

@Module({
  controllers: [AppController, UserController],
  providers: [
    AppService,
    UserService,
    {
      provide: 'UserService.UserRepository',
      useClass: UserRepositoryImpl,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware);
  }
}
