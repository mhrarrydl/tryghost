const debug = require('@tryghost/debug')('hardcore-router');

module.exports = class HardcoreRouter {
    constructor({express, config, urlUtils, api}) {
        debug('Initializing HardcoreRouter');
        this.express = express;
        this.config = config;
        this.urlUtils = urlUtils;
        this.api = api;
    }

    urlFor() {
        // Lookup the URL from the storage
    }

    async routeRequest(req, res, next) {
        let response = {
            router: 'HardcoreRouter',
            path: req.path
        };

        // Routing logic here

        res.status(501).send('<h1>Hardcore Stuff Not Implemented. Yet!</h1>');

        debug('response', response);
        debug('routerOptions', res.routerOptions);
    }
};
