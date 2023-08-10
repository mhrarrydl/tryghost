const {Tier} = require('@tryghost/tiers');
const nql = require('@tryghost/nql');

/**
 * @typedef {import('@tryghost/tiers/lib/TiersAPI').ITierRepository} ITierRepository
 */

/**
 * @typedef {any} TierData
 */

/**
 * @template V
 * @typedef {object} ICache<V>
 * @prop {(key: string, value: V) => Promise<void>} set
 * @prop {(key: string) => Promise<V | null>} get
 */

/**
 * @implements {ITierRepository}
 */
module.exports = class RedisCacheTierRepository {
    /** @type {Object} */
    #ProductModel;

    /** @type {ICache<TierData>} */
    #cache;

    /** @type {import('@tryghost/domain-events')} */
    #DomainEvents;

    /**
     * @param {object} deps
     * @param {object} deps.ProductModel Bookshelf Model
     * @param {import('@tryghost/domain-events')} deps.DomainEvents
     * @param {ICache<TierData>} deps.cache
     */
    constructor(deps) {
        this.#ProductModel = deps.ProductModel;
        this.#DomainEvents = deps.DomainEvents;
        this.#cache = deps.cache;
    }

    async init() {
        const allTierData = await this.#getAll(true);
        for (const tierData of allTierData) {
            await this.#getByID(tierData.id, true);
        }
    }

    async #setAll(all) {
        await this.#cache.set('@@all@@', all);
    }
    async #setOne(data) {
        await this.#cache.set(data.id, data);
    }
    async #getAll(resave = false) {
        let all = await this.#cache.get('@@all@@');
        if (!all) {
            const models = await this.#ProductModel.findAll({
                withRelated: ['benefits']
            });
            all = models.map(model => this.mapToTier(model));
            if (resave) {
                await this.#setAll(all);
            }
        }
        return all;
    }

    async #getByID(id, resave = false) {
        let tierData = await this.#cache.get(id);
        if (!tierData) {
            const model = await this.#ProductModel.findOne({id}, {
                withRelated: ['benefits']
            });
            if (!model) {
                return null;
            }
            tierData = this.mapToTier(model);
            if (resave) {
                await this.#setOne(tierData);
            }
        }
        return tierData;
    }

    /**
     * @param {import('@tryghost/tiers/lib/Tier')} tier
     * @returns {any}
     */
    toPrimitive(tier) {
        return {
            ...tier.toJSON(),
            active: (tier.status === 'active'),
            type: tier.type,
            id: tier.id.toHexString()
        };
    }

    /**
     * @private
     * @returns {TierData}
     */
    mapToTier(model) {
        const json = model.toJSON();
        return {
            id: json.id,
            name: json.name,
            slug: json.slug,
            status: json.active ? 'active' : 'archived',
            welcomePageURL: json.welcome_page_url,
            visibility: json.visibility,
            trialDays: json.trial_days,
            description: json.description,
            type: json.type,
            currency: json.currency,
            monthlyPrice: json.monthly_price,
            yearlyPrice: json.yearly_price,
            createdAt: json.created_at,
            updatedAt: json.updated_at,
            benefits: json.benefits.map(item => item.name)
        };
    }

    /**
     * @param {object} [options]
     * @param {string} [options.filter]
     * @returns {Promise<import('@tryghost/tiers/lib/Tier')[]>}
     */
    async getAll(options = {}) {
        let allTierData = await this.#getAll(true);
        const filter = nql(options.filter, {});
        const tiers = await Promise.all(allTierData.map(tierData => Tier.create(tierData)));

        return tiers.filter((item) => {
            return filter.queryJSON(this.toPrimitive(item));
        });
    }

    /**
     * @param {import('bson-objectid').default} id
     * @returns {Promise<import('@tryghost/tiers/lib/Tier')>}
     */
    async getById(id) {
        let found = await this.#getByID(id.toHexString(), true);

        if (!found) {
            return null;
        }

        return Tier.create(found);
    }

    /**
     * @param {import('@tryghost/tiers/lib/Tier')} tier
     * @returns {Promise<void>}
     */
    async save(tier) {
        const data = {
            id: tier.id.toHexString(),
            name: tier.name,
            slug: tier.slug,
            active: tier.status === 'active',
            welcome_page_url: tier.welcomePageURL,
            visibility: tier.visibility,
            trial_days: tier.trialDays,
            description: tier.description,
            type: tier.type,
            currency: tier.currency,
            monthly_price: tier.monthlyPrice,
            yearly_price: tier.yearlyPrice,
            created_at: tier.createdAt,
            updated_at: tier.updatedAt,
            benefits: tier.benefits.map(name => ({name}))
        };

        const existing = await this.#getByID(tier.id.toHexString());

        let model;
        let allTierData = await this.#getAll();
        if (existing) {
            model = await this.#ProductModel.edit(data, {
                id: data.id
            });
        } else {
            model = await this.#ProductModel.add(data);
            allTierData.push(this.mapToTier(model));
            await this.#setAll(allTierData);
        }

        await this.#setOne(this.mapToTier(model));

        for (const event of tier.events) {
            this.#DomainEvents.dispatch(event);
        }
    }
};

