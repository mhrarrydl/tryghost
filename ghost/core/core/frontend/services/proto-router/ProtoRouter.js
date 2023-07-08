module.exports = class ProtoRouter {
    constructor({express, config, api}) {
        this.express = express;
        this.config = config;
        this.api = api;
    }

    async routeRequest(req, res, next) {
        let response = {
            router: 'ProtoRouter',
            path: req.path
        };

        if (req.path === '/archive/') {
            let posts = await this.api.posts.browse({limit: 15});

            posts.posts.forEach((post) => {
                post.url = `${this.config.getSiteUrl()}${post.slug}-${post.id}/`;
            });

            response.data = posts;
            response.type = 'archive';
        } else if (/^\/[a-z0-9-]+-[0-9a-f]{24}\/$/.test(req.path)) {
            let match = req.path.match(/^\/([a-z0-9-])+-([0-9a-f]{24})\/$/);
            let id = match[2];
            let post = await this.api.posts.read({id: id});

            response.data = post;
            response.type = 'post';
        } else {
            response.data = {};
            response.type = 'unknown';
            response.template = 'unknown';
        }

        // @TODO: use a renderer
        res.json(response);
    }
};
