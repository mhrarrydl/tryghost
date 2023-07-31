const debug = require('@tryghost/debug')('hardcore-router');
const RoutingService = require('./RoutingService');
const {checks} = require('../data');
const rendering = require('../rendering');

module.exports = class HardcoreRouter {
    constructor({express, config, urlUtils, api}) {
        debug('Initializing HardcoreRouter');
        this.express = express;
        this.config = config;
        this.urlUtils = urlUtils;
        this.api = api;

        this.routingService = new RoutingService();
        this.routingServiceReady = this.populateRoutingService();
    }

    /**
     * This would not be used in real life - this is just to make the prototype work
     * Rather than sticking shit in the database RN - this will just populate the in-memory store.
     * HAxxxxxxxXor
     */
    async populateRoutingService() {
        const {collections} = await this.api.collections.browse();
        const {tags} = await this.api.tags.browse();
        const {posts} = await this.api.posts.browse();

        const homepageURL = new URL(`/`, this.baseUrl());
        await this.routingService.assignURL(homepageURL, {
            type: 'template',
            slug: 'homepage',
            data: {}
        });

        for (const collection of collections) {
            const url = new URL(`/${collection.slug}/`, this.baseUrl());
            await this.routingService.assignURL(url, {
                type: 'collection',
                id: collection.id
            });
        }

        for (const tag of tags) {
            const url = new URL(`/tag/${tag.slug}/`, this.baseUrl());
            await this.routingService.assignURL(url, {
                type: 'tag',
                id: tag.id
            });
        }

        for (const post of posts) {
            const url = new URL(`/post/${post.slug}/`, this.baseUrl());
            await this.routingService.assignURL(url, {
                type: 'post',
                id: post.id
            });
        }
    }

    baseUrl() {
        return this.config.getSiteUrl();
    }

    async urlFor(data) {
        await this.routingServiceReady;
        if (checks.isPost(data)) {
            return this.routingService.getURL({
                id: data.id,
                type: 'post'
            });
        } else if (checks.isNav(data)) {
            // I don't really know what a "Nav" is
            // I think we can just return the URL?
            return this.urlUtils.urlJoin(this.baseUrl(), `/${data.url}/`);
        } else if (checks.isTag(data)) {
            return this.routingService.getURL({
                id: data.id,
                type: 'tag'
            });
        } else if (checks.isUser(data)) {
            return this.routingService.getURL({
                id: data.id,
                type: 'author'
            });
        } else if (checks.isCollection(data)) {
            return this.routingService.getURL({
                id: data.id,
                type: 'collection'
            });
        }
    }

    /**
     * @param {URL} url
     */
    async getDataForUrl(url) {
        const baseUrl = this.baseUrl();

        const fullUrl = new URL(url, baseUrl);

        const resource = await this.routingService.getResource(fullUrl);

        if (!resource) {
            return null;
        }

        if (resource.type === 'post') {
            let {posts} = await this.api.posts.read({id: resource.id, formats: ['html']});
            let post = posts[0];

            return {
                data: {post},
                type: 'entry',
                routerType: 'entry'
            };
        }

        if (resource.type === 'tag') {
            const apiOptions = {
                limit: 15,
                formats: ['html']
            };

            apiOptions.filter = `tag:${resource.id}`;

            let posts = await this.api.posts.browse(apiOptions);

            const data = posts;
            data.pagination = posts.meta.pagination;

            return {
                data,
                type: 'archive',
                routerType: 'channel'
            };
        }

        if (resource.type === 'author') {
            const apiOptions = {
                limit: 15,
                formats: ['html']
            };

            apiOptions.filter = `author:${resource.id}`;

            let posts = await this.api.posts.browse(apiOptions);

            const data = posts;
            data.pagination = posts.meta.pagination;

            return {
                data,
                type: 'archive',
                routerType: 'channel'
            };
        }

        if (resource.type === 'collection') {
            let posts = await this.api.posts.browse({
                collection: resource.id,
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

        if (resource.type === 'template') {
            return {
                data: {
                    template: 'homepage'
                },
                type: 'static',
                routerType: 'custom'
            };
        }

        // TODO: resource.type === 'page'

        return null;
    }

    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async routeRequest(req, res, next) {
        await this.routingServiceReady;
        let response = {
            router: 'ProtoRouter',
            path: req.path
        };

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
            res.routerOptions = {
                type: routerType
            };

            if (data.posts) {
                response.data.posts = await Promise.all(data.posts.map(async (post) => {
                    return {
                        ...post,
                        url: await this.urlFor(post)
                    };
                }));
            } else if (data.post) {
                response.data.post = {
                    ...data.post,
                    url: await this.urlFor(data.post)
                };
            } else if (data.template) {
                res.routerOptions.defaultTemplate = data.template;
                res.routerOptions.templates = [data.template];
            }

            response.type = type;

            rendering.renderer(req, res, response.data);
        }

        debug('response', response);
        debug('routerOptions', res.routerOptions);
    }
};
