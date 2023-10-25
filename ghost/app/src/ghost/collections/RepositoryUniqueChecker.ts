import {CollectionRepository} from './CollectionRepository';
import {UniqueChecker} from './UniqueChecker';
import {Inject} from '@nestjs/common';

export class RepositoryUniqueChecker implements UniqueChecker {
    constructor(
        @Inject('CollectionRepository') private repository: CollectionRepository
    ) {}

    async isUniqueSlug(slug: string): Promise<boolean> {
        const entity = await this.repository.getBySlug(slug);
        return entity === null;
    }
}
