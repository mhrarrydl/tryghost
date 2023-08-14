/* eslint-disable no-inner-declarations */
const {Tier} = require('@tryghost/tiers');
const nql = require('@tryghost/nql');
const Redis = require('ioredis').default;
const assert = require('assert/strict');
const {default: ObjectID} = require('bson-objectid');

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
module.exports = class RedisNQLCacheTierRepository {
    /** @type {Object} */
    #ProductModel;

    /** @type {Redis} */
    #redisClient;

    /** @type {import('@tryghost/domain-events')} */
    #DomainEvents;

    /**
     * @param {object} deps
     * @param {object} deps.ProductModel Bookshelf Model
     * @param {import('@tryghost/domain-events')} deps.DomainEvents
     * @param {import('ioredis').RedisOptions} deps.redisOptions
     */
    constructor(deps) {
        this.#ProductModel = deps.ProductModel;
        this.#DomainEvents = deps.DomainEvents;
        this.#redisClient = new Redis(deps.redisOptions);
    }

    async init() {
        const models = await this.#ProductModel.findAll({
            withRelated: ['benefits']
        });
        const allTierData = models.map(model => this.mapToTier(model));
        for (const tierData of allTierData) {
            await this.#getByID(tierData.id, true);
        }

        // Setup indexes for
        // 1. active
        // 2. type
        // 3. currency
        const activeTiers = allTierData.filter(tierData => tierData.status === 'active');
        const paidTiers = allTierData.filter(tierData => tierData.type === 'paid');
        const tiersByCurrency = allTierData.reduce(function (memo, tierData) {
            const currency = tierData.currency;
            if (!currency) {
                return memo;
            }
            if (!memo[currency]) {
                memo[currency] = [tierData];
            } else {
                memo[currency].push(tierData);
            }
            return memo;
        }, {});
        await this.#redisClient.sadd('tiers_idx_all', allTierData.map(tierData => tierData.id));
        await this.#redisClient.sadd('tiers_idx_active', activeTiers.map(tierData => tierData.id));
        await this.#redisClient.sadd('tiers_idx_paid', paidTiers.map(tierData => tierData.id));
        for (const key in tiersByCurrency) {
            await this.#redisClient.sadd(`tiers_idx_currency_${key}`, tiersByCurrency[key].map(tierData => tierData.id));
        }
    }

    async #setJSON(key, value) {
        await this.#redisClient.set(`tiers:${key}`, JSON.stringify(value));
    }

    async #getJSON(key) {
        return JSON.parse(await this.#redisClient.get(`tiers:${key}`));
    }

    async #setAll(all) {
        await this.#setJSON('@@all@@', all);
    }

    async #setOne(data) {
        await this.#setJSON(data.id, data);
    }
    async #getAll(resave = false) {
        let all = await this.#getJSON('@@all@@');
        if (!all) {
            if (resave) {
                await this.#setAll(all);
            }
        }
        return all;
    }
    async #getByID(id, resave = false) {
        let tierData = await this.#getJSON(id);
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
        let ids;
        let filter;
        if (!options.filter) {
            //ids = await this.#redisClient.smembers('tiers_idx_all');
        } else {
            filter = nql(options.filter, {});
            const filterObj = filter.toJSON();
            let keysUsed = [];
            nql.utils.mapQuery(filterObj, function (value, key) {
                keysUsed.push(key);
            });

            function getKeyValueFromObj(obj) {
                const keys = Object.keys(obj);
                assert(keys.length === 1, 'getKeyValueFromObj can only work with objects with a single key');

                const key = keys[0];
                const value = obj[key];

                return {key, value};
            }

            function getInverseForBoolean(value) {
                let inverse;
                if (typeof value === 'boolean') {
                    inverse = !value;
                } else {
                    const {key: operator, value: operatorValue} = getKeyValueFromObj(value);
                    assert(['$ne', '$eq'].includes(operator), 'buildSet can only work with $ne or $eq operators');
                    if (operator === '$ne') {
                        inverse = operatorValue;
                    } else {
                        inverse = !operatorValue;
                    }
                }
                return inverse;
            }

            function getInverseForFlag(value, correctValue) {
                let inverse;
                if (typeof value === 'string') {
                    inverse = value !== correctValue;
                } else {
                    const {key: operator, value: operatorValue} = getKeyValueFromObj(value);
                    assert(['$ne', '$eq'].includes(operator), 'buildSet can only work with $ne or $eq operators');
                    if (operator === '$ne') {
                        inverse = operatorValue === correctValue;
                    } else {
                        inverse = operatorValue !== correctValue;
                    }
                }
                return inverse;
            }

            function buildSet(obj) {
                const {key, value} = getKeyValueFromObj(obj);

                assert(['active', 'type'/*, 'currency'*/].includes(key), `buildSet can only work with active/paid/currency filters got ${key}`);

                if (key === 'active') {
                    const inverse = getInverseForBoolean(value);
                    if (inverse) {
                        return {
                            SDIFF: ['tiers_idx_all', 'tiers_idx_active']
                        };
                    } else {
                        return 'tiers_idx_active';
                    }
                }
                if (key === 'type') {
                    const inverse = getInverseForFlag(value, 'paid');
                    if (inverse) {
                        return {
                            SDIFF: ['tiers_idx_all', 'tiers_idx_paid']
                        };
                    } else {
                        return 'tiers_idx_paid';
                    }
                }
            }

            function generateSetOperations(obj) {
                const {key, value} = getKeyValueFromObj(obj);
                if (key === '$and') {
                    return {
                        SINTER: value.map(sub => generateSetOperations(sub))
                    };
                } else if (key === '$or') {
                    return {
                        SUNION: value.map(sub => generateSetOperations(sub))
                    };
                } else {
                    return buildSet(obj);
                }
            }

            const makeKey = () => (new ObjectID()).toHexString();

            const flattenRedisOperation = async (operation, tempKeys) => {
                if (typeof operation === 'string') {
                    return operation;
                } else {
                    const {key, value} = getKeyValueFromObj(operation);
                    assert(['SUNION', 'SDIFF', 'SINTER'].includes(key), 'runRedisSetOperations only supports SUNION, SDIFF and SINTER');

                    const sets = await Promise.all(
                        value.map(o => flattenRedisOperation(o, tempKeys))
                    );
                    const tempKey = makeKey();
                    tempKeys.push(tempKey);

                    if (key === 'SUNION') {
                        await this.#redisClient.sunionstore(tempKey, ...sets);
                    }
                    if (key === 'SDIFF') {
                        await this.#redisClient.sdiffstore(tempKey, ...sets);
                    }
                    if (key === 'SINTER') {
                        await this.#redisClient.sinterstore(tempKey, ...sets);
                    }
                    console.log(`Stored ${key} of ${sets} in ${tempKey} `);
                    return tempKey;
                }
            };

            // Only filtering on indexed keys - we can do this from da cache
            if (keysUsed.every(key => ['active', 'type', 'currency'].includes(key))) {
                const setOperations = generateSetOperations(filterObj);
                const tempKeys = [];
                const set = await flattenRedisOperation(setOperations, tempKeys);
                ids = await this.#redisClient.smembers(set);
                for (const tempKey of tempKeys) {
                    //await this.#redisClient.del(tempKey);
                }
            }
        }

        if (!ids || !ids.length) {
            const models = await this.#ProductModel.findAll({
                withRelated: ['benefits'],
                filter: options.filter
            });

            return await Promise.all(
                models.map(
                    model => Tier.create(this.mapToTier(model))
                )
            );
        } else {
            const tierData = await Promise.all(ids.map(id => this.#getByID(id, true)));
            return await Promise.all(tierData.map(data => Tier.create(data)));
        }
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
        if (existing) {
            model = await this.#ProductModel.edit(data, {
                id: data.id
            });
        } else {
            model = await this.#ProductModel.add(data);
        }

        await this.#setOne(this.mapToTier(model));

        for (const event of tier.events) {
            this.#DomainEvents.dispatch(event);
        }
    }
};
