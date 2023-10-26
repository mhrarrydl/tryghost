import { MiddlewareConsumer } from '@nestjs/common';

import {CollectionController} from './http/controllers/collections/collection.controller';
import {BookshelfCollectionsRepository} from './db/collection.knex.repository';
import {CollectionsService} from './ghost/collections/CollectionsService';
import {RepositoryUniqueChecker} from './ghost/collections/RepositoryUniqueChecker';
import {CollectionSlugService} from './db/collection-slug.service';
import {UserAuthMiddleware} from './http/middleware/user-auth.middleware';

class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(UserAuthMiddleware).forRoutes('*');
    }
}

export const App = {
    module: AppModule,
    // module: null, // We can pass `null` when we do not need any configuration for the module

    controllers: [CollectionController],
    providers: [
        CollectionsService,
        {
            provide: 'CollectionsService',
            useClass: CollectionsService
        },
        {
            provide: 'CollectionRepository',
            useClass: BookshelfCollectionsRepository
        },
        {
            provide: 'CollectionUniqueChecker',
            useClass: RepositoryUniqueChecker
        },
        {
            provide: 'CollectionSlugService',
            useClass: CollectionSlugService
        }
    ],
};
