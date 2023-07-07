const debug = require('@tryghost/debug')('newfe');

module.exports = class ProtoFrontend {
    constructor({express}) {
        this.app = express('newfe');

        this.app.use(this.router.bind(this));
    }

    async router(req, res) {
        let response = {};

        debug('SERVING NEW FE from', req.path);

        response = {path: req.path, type: 'unknown', data: {}, template: 'unknown'};

        res.json(response);
    }
};
