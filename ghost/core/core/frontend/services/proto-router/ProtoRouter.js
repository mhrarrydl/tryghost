const debug = require('@tryghost/debug')('proto-router');
const BasicRouter = require('./BasicRouter');
const HardcoreRouter = require('./HardcoreRouter');

module.exports = class ProtoRouter {
    constructor({express, config, urlUtils, api, mode}) {
        this.express = express;
        this.config = config;
        this.urlUtils = urlUtils;
        this.api = api;
        this.mode = mode;

        this.routers = {};
        this.routers.basic = new BasicRouter({express, config, urlUtils, api});
        this.routers.hardcore = new HardcoreRouter({express, config, urlUtils, api});
    }

    get routerMode() {
        const labs = require('../../../shared/labs');
        let useHardcoreRouter = labs.isSet('hardcoreRouter');

        // WARNING: ENV VAR overrides labs...
        if (['basic', 'hardcore'].includes(this.mode)) {
            return this.mode;
        } else {
            return useHardcoreRouter ? 'hardcore' : 'basic';
        }
    }

    urlFor(data) {
        return this.routers[this.routerMode].urlFor(data);
    }

    /**
     * @param {URL} url
     */
    async getDataForUrl(url) {
        return this.routers[this.routerMode].getDataForUrl(url);
    }

    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async routeRequest(req, res, next) {
        return this.routers[this.routerMode].routeRequest(req, res, next);
    }
};
