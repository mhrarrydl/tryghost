import Redis, {RedisOptions} from 'ioredis';

export class Cache {
    private redisClient: Redis;
    constructor(config: RedisOptions) {
        this.redisClient = new Redis(config);
    }

    async getById() {}
    async getAll(options) {}
}
