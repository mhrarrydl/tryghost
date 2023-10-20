import {Injectable} from "@nestjs/common";
import {UserService} from "./ghost/user/user.service";
import {UserRepositoryImpl} from "./db/user.repository.impl";

class ServicesModule {}

Injectable()(UserService);

export const Services = {
    module: ServicesModule,
    controllers: [],
    providers: [
        UserService,
        {
            provide: "UserRepository",
            useClass: UserRepositoryImpl,
        },
    ],
    exports: [UserService],
};
