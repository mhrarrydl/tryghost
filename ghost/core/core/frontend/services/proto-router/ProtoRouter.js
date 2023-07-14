const debug = require('@tryghost/debug')('proto-router');

const {checks} = require('../data');
const rendering = require('../rendering');

module.exports = class ProtoRouter {
    constructor({express, config, urlUtils, api}) {
        this.express = express;
        this.config = config;
        this.urlUtils = urlUtils;
        this.api = api;
    }

    baseUrl() {
        return this.config.getSiteUrl();
    }

    urlFor(data) {
        let baseUrl = this.baseUrl();

        if (checks.isPost(data)) {
            baseUrl = this.urlUtils.urlJoin(baseUrl, `/${data.slug}-${data.id}/`);
        } else if (checks.isNav(data)) {
            baseUrl = this.urlUtils.urlJoin(baseUrl, `/${data.url}/`);
        }

        return baseUrl;
    }

    async routeRequest(req, res, next) {
        let response = {
            router: 'ProtoRouter',
            path: req.path
        };

        // CASE: the default unmovable archive page
        if (req.path === '/archive/') {
            let posts = await this.api.posts.browse({limit: 15, formats: ['html']});

            posts.posts.forEach((post) => {
                post.url = `${this.config.getSiteUrl()}${post.slug}-${post.id}/`;
            });

            response.data = posts;
            response.data.pagination = posts.meta.pagination;
            response.type = 'archive';

            res.routerOptions = {
                type: 'channel'
            };

            rendering.renderer(req, res, posts);

        // CASE: a post!
        } else if (/^\/[a-z0-9-]+-[0-9a-f]{24}\/$/.test(req.path)) {
            // Deal with routing
            let match = req.path.match(/^\/([a-z0-9-])+-([0-9a-f]{24})\/$/);
            let id = match[2];

            // Deal with matching formats
            let {posts} = await this.api.posts.read({id: id, formats: ['html']});
            let post = posts[0];

            response.data = {post};
            response.type = 'entry';

            res.routerOptions = {
                type: 'entry'
            };

            rendering.renderer(req, res, response.data);
        } else {
            response.data = {};
            response.type = 'unknown';
            response.template = 'unknown';

            const html = `<h1>Unknown route</h1><div><pre>${JSON.stringify(response, null, 2)}</pre></div><div><p>Visit <a href="${this.baseUrl()}archive/">/archive/</a> to see a list of posts.</p></div>`;

            res.status(404).send(html);
        }

        debug('response', response);
        debug('routerOptions', res.routerOptions);
    }
};
