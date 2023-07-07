const debug = require('@tryghost/debug')('newfe');
const DemoRouter = require('./DemoRouter');

module.exports = class ProtoFrontend {
    constructor({express}) {
        this.app = express('newfe');

        // Later we could switch this based on a labs dropdown if we need to
        this.activeRouter = 'demoRouter';

        // Setup the router(s)
        this.demoRouter = new DemoRouter({express});

        // bind a local router to actually decide which one to use on the fly - just for the prototype
        this.app.use(this.router.bind(this));
    }

    async router(req, res) {
        debug('SERVING NEW FE from', req.path);

        if (this.activeRouter === 'demoRouter') {
            return this.demoRouter.routeRequest(req, res);
        } else {
            return res.status(404).send('No Router Found');
        }
    }
};
