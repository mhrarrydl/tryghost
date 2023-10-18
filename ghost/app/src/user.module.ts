import { Module } from '@nestjs/common';
import { UserService } from './ghost/user/user.service';
import { UserController } from './http/controllers/user.controller';
import { UserRepositoryImpl } from './db/user.repository.impl';
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'UserService.UserRepository',
      useClass: UserRepositoryImpl,
    },
  ],
})
export class UserModule {}
