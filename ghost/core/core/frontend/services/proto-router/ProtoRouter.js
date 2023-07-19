const debug = require('@tryghost/debug')('proto-router');

const {checks} = require('../data');
const rendering = require('../rendering');

const SLUG_REGEX = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/;

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
            return this.urlUtils.urlJoin(baseUrl, `/${data.slug}-${data.id}/`);
        } else if (checks.isNav(data)) {
            return this.urlUtils.urlJoin(baseUrl, `/${data.url}/`);
        } else if (checks.isTag(data)) {
            return this.urlUtils.urlJoin(baseUrl, `/archive/?tag=${data.slug}/`);
        } else if (checks.isUser(data)) {
            return this.urlUtils.urlJoin(baseUrl, `/archive/?author=${data.slug}/`);
        } else if (checks.isCollection(data)) {
            return this.urlUtils.urlJoin(baseUrl, `/${data.slug}/`);
        }

        return baseUrl;
    }

    async routeRequest(req, res, next) {
        let response = {
            router: 'ProtoRouter',
            path: req.path
        };

        let baseUrl = this.baseUrl();

        function unknown() {
            response.data = {};
            response.type = 'unknown';
            response.template = 'unknown';

            const html = `<h1>Unknown route</h1><div><pre>${JSON.stringify(response, null, 2)}</pre></div><div><p>Visit <a href="${baseUrl}archive/">/archive/</a> to see a list of posts.</p></div>`;

            res.status(404).send(html);
            debug('response', response);
            debug('routerOptions', res.routerOptions);
        }

        // CASE: the default unmovable archive page
        if (req.path === '/archive/') {
            const apiOptions = {
                limit: 15,
                formats: ['html']
            };

            if (req.query.tag) {
                apiOptions.filter = `tag:${req.query.tag}`;
            }

            if (req.query.author) {
                const authorFilter = `author:${req.query.author}`;

                if (apiOptions.filter) {
                    apiOptions.filter = `${apiOptions.filter}+${authorFilter}`;
                } else {
                    apiOptions.filter = authorFilter;
                }
            }

            let posts = await this.api.posts.browse(apiOptions);

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
        } else if (SLUG_REGEX.test(req.path)) { // CASE: a slug - possibly a collection
            const [match, slug] = req.path.match(SLUG_REGEX) || [false];
            if (!match) {
                return unknown();
            }

            let result;
            try {
                result = await this.api.collections.read({slug});
                if (!result) {
                    return unknown();
                }
            } catch (err) {
                return unknown();
            }

            let posts = await this.api.posts.browse({collection: result.collections[0].id});

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
        } else if (/^\/[a-z0-9-]+-[0-9a-f]{24}\/$/.test(req.path)) { // CASE: a post!
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
            unknown();
        }

        debug('response', response);
        debug('routerOptions', res.routerOptions);
    }
};
