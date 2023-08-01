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

    /**
     * @param {URL} url
     */
    async getDataForUrl(url) {
        // CASE: Hardcoded archive URL
        if (url.pathname === '/archive/') {
            const apiOptions = {
                limit: 15,
                formats: ['html']
            };

            if (url.searchParams.get('tag')) {
                apiOptions.filter = `tag:${url.searchParams.get('tag')}`;
            }

            if (url.searchParams.get('author')) {
                const authorFilter = `author:${url.searchParams.get('author')}`;

                if (apiOptions.filter) {
                    apiOptions.filter = `${apiOptions.filter}+${authorFilter}`;
                } else {
                    apiOptions.filter = authorFilter;
                }
            }

            let posts = await this.api.posts.browse(apiOptions);

            const data = posts;
            data.pagination = posts.meta.pagination;

            return {
                data,
                type: 'archive',
                routerType: 'channel'
            };
        }

        const getCollection = async (slug) => {
            try {
                return await this.api.collections.read({slug});
            } catch (err) {
                return null;
            }
        };

        // CASE: a slug - possibly a collection
        const [matchesSlug, collectionSlug] = url.pathname.match(SLUG_REGEX) || [false];
        if (matchesSlug) {
            const result = await getCollection(collectionSlug);
            if (result) {
                let posts = await this.api.posts.browse({
                    collection: result.collections[0].id,
                    formats: ['html']
                });

                const data = posts;
                data.pagination = posts.meta.pagination;

                return {
                    data,
                    type: 'archive',
                    routerType: 'channel'
                };
            }
        }

        // CASE: Slug & ID combo - a post :)
        const [matchesSlugIdCombo, postSlug, id] = url.pathname.match(/^\/([a-z0-9-])+-([0-9a-f]{24})\/$/) || [false];
        if (matchesSlugIdCombo) {
            let {posts} = await this.api.posts.read({id: id, formats: ['html']});
            let post = posts[0];

            return {
                data: {post},
                type: 'entry',
                routerType: 'entry'
            };
        }

        return null;
    }

    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async routeRequest(req, res, next) {
        let response = {
            router: 'ProtoRouter',
            path: req.path
        };

        if (req.path === '/') {
            response.data = {};
            response.type = 'static';
            response.template = 'custom-homepage';

            res.routerOptions = {
                type: 'custom',
                defaultTemplate: 'homepage',
                templates: ['homepage', 'home', 'index']
            };

            rendering.renderer(req, res, response.data);
            return;
        }

        let baseUrl = this.baseUrl();

        const url = new URL(req.url, baseUrl);

        const {data, type, routerType} = await this.getDataForUrl(url) || {};

        if (!data) {
            response.data = {};
            response.type = 'unknown';
            response.template = 'unknown';

            const html = `<h1>Unknown route</h1><div><pre>${JSON.stringify(response, null, 2)}</pre></div><div><p>Visit <a href="${baseUrl}archive/">/archive/</a> to see a list of posts.</p></div>`;

            res.status(404).send(html);
        } else {
            response.data = data;

            if (data.posts) {
                response.data.posts = data.posts.map((post) => {
                    return {
                        ...post,
                        url: this.urlFor(post)
                    };
                });
            } else if (data.post) {
                response.data.post = {
                    ...data.post,
                    url: this.urlFor(data.post)
                };
            }
            response.type = type;

            res.routerOptions = {
                type: routerType
            };

            rendering.renderer(req, res, response.data);
        }

        debug('response', response);
        debug('routerOptions', res.routerOptions);
    }
};
