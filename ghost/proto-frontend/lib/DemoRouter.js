module.exports = class DemoRouter {
    constructor({express}) {
        this.express = express;
    }

    async routeRequest(req, res) {
        let response = {};

        // @TODO: do some sort of lookup to determine what to do with the request!
        response = {router: 'DemoRouter', path: req.path, type: 'unknown', data: {}, template: 'unknown'};

        // @TODO: use a renderer
        res.json(response);
    }
};
