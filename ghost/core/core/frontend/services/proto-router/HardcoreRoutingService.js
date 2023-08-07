/**
 * @typedef {import('bson-objectid').default} ObjectID
 */

/**
 * @typedef {Object} IDBasedResource
 * @property {ObjectID} id - The ID of the resource.
 * @property {'post' | 'page' | 'tag' | 'collection' | 'author'} type - The type of the resource.
 */

/**
 * @typedef {Object} SlugBasedResource
 * @property {string} slug - The slug of the resource.
 * @property {'template'} type - The type of the resource.
 * @property {{[key: string]: any}} data - Additional data for the resource.
 */

/**
 * @typedef {(SlugBasedResource | IDBasedResource)} RoutingResource
*/
module.exports = class HardcoreRoutingService {
    constructor({config}) {
        this.config = config;
        this.urls = new Map();
        this.resources = new Map();
    }

    baseUrl() {
        return this.config.getSiteUrl();
    }

    /**
     * @param {URL} url
     * @returns {Promise<RoutingResource>}
     */
    async getResource(url) {
        const resource = this.resources.get(url.toString());
        if (resource) {
            return resource;
        }

        return null;
    }
    /**
     * @param {RoutingResource} resource
     * @returns {Promise<URL>}
     */
    async getURL(resource) {
        if ('id' in resource) {
            return this.urls.get(resource.id.toString());
        } else {
            return this.urls.get(resource.slug);
        }
    }

    /**
     * @param {URL} url
     * @param {RoutingResource} resource
     * @returns {Promise<URL>}
     */
    async reassignURL(url, resource) {
        if (this.resources.has(url.toString())) {
            return this.reassignURL(this.getDifferentURL(url), resource);
        }

        let previousURL = await this.getURL(resource);

        if ('id' in resource) {
            this.urls.set(resource.id.toString(), url);
        } else {
            this.urls.set(resource.slug, url);
        }

        this.resources.set(url.toString(), resource);
        this.resources.delete(previousURL.toString());

        return url;
    }

    /**
     * @param {URL} url
     * @param {RoutingResource} resource
     * @returns {Promise<URL>}
     */
    async assignURL(url, resource) {
        if (this.resources.has(url.toString())) {
            return this.assignURL(this.getDifferentURL(url), resource);
        }
        if ('id' in resource) {
            this.urls.set(resource.id.toString(), url);
        } else {
            this.urls.set(resource.slug, url);
        }
        this.resources.set(url.toString(), resource);
        return url;
    }

    /**
     *
     * @param {RoutingResource} resource
     */
    async getNewURL(resource) {
        let url;

        if (resource.type === 'post') {
            url = new URL(`/post/${resource.slug}/`, this.baseUrl());
        } else {
            // NOTE: add more types here
            url = new URL(`/post/${resource.slug}/`, this.baseUrl());
        }

        return await this.assignURL(url, {
            type: resource.type,
            id: resource.id
        });
    }

    getDifferentURL(url) {
        let path = url.pathname;

        path = path.slice(0, -1); // Remove trailing slash

        if (path.match(/-\d+$/)) {
            const parts = path.split('-');
            const number = parseInt(parts.pop(), 10);
            parts.push(number + 1);
            path = parts.join('-');
        } else {
            path += '-1';
        }

        return new URL(path + '/', this.baseUrl()); // Don't forget to add the trailing slash back
    }
};
