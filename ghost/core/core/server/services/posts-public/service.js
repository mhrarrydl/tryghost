class PostsPublicServiceWrapper {
    async init() {
        if (this.api) {
            // Already done
            return;
        }

        // Wire up all the dependencies
        const adapterManager = require('../adapter-manager');
        const EventAwareCacheWrapper = require('@tryghost/event-aware-cache-wrapper');
        const EventRegistry = require('../../lib/common/events');

        const postsCache = new EventAwareCacheWrapper({
            cache: adapterManager.getAdapter('cache:postsPublic'),
            resetEvents: ['site.changed'],
            eventRegistry: EventRegistry
        });

        // @NOTE: exposing cache through getter and setter to not loose the context of "this"
        const cache = {
            get() {
                return postsCache.get(...arguments);
            },
            set() {
                return postsCache.set(...arguments);
            }
        };

        this.api = {
            cache: cache
        };
    }
}

module.exports = new PostsPublicServiceWrapper();
