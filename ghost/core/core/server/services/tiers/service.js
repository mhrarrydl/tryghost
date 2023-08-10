class TiersServiceWrapper {
    async init() {
        if (this.api) {
            // Already done
            return;
        }

        const {TiersAPI} = require('@tryghost/tiers');
        const DomainEvents = require('@tryghost/domain-events');

        const models = require('../../models');
        const TierRepository = require('./TierRepository');
        const RedisCacheTierRepository = require('./RedisCacheTierRepository');

        const adapterManager = require('../adapter-manager');

        const cache = adapterManager.getAdapter('cache:tiers');

        let repository;

        if (cache) { // This is always true and returns in-memory cache
            repository = new RedisCacheTierRepository({
                ProductModel: models.Product,
                DomainEvents,
                cache
            });
        } else {
            repository = new TierRepository({
                ProductModel: models.Product,
                DomainEvents
            });
        }

        const slugService = {
            async generate(input) {
                return models.Product.generateSlug(models.Product, input, {});
            }
        };

        await repository.init();

        this.repository = repository;

        this.api = new TiersAPI({
            repository,
            slugService
        });
    }
}

module.exports = new TiersServiceWrapper();
