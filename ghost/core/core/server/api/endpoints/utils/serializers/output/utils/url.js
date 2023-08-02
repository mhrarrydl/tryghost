const urlService = require('../../../../../../services/url');
const urlUtils = require('../../../../../../../shared/url-utils');
const localUtils = require('../../../index');
const labs = require('../../../../../../../shared/labs');

const forPost = async (id, attrs, frame) => {
    if (labs.isSet('hardcoreRouter')) {
        const hardcoreURLService = global.routingService;
        attrs.url = await hardcoreURLService.getURL({
            id: id
        });

        if (!localUtils.isContentAPI(frame)) {
            if (attrs.status !== 'published') {
                if (attrs.posts_meta && attrs.posts_meta.email_only) {
                    attrs.preview_url = urlUtils.urlFor({
                        relativeUrl: urlUtils.urlJoin('/email', attrs.uuid, '/')
                    }, null, true);
                } else {
                    attrs.preview_url = urlUtils.urlFor({
                        relativeUrl: urlUtils.urlJoin('/p', attrs.uuid, '/')
                    }, null, true);
                }
            }
        }
    } else {
        attrs.url = urlService.getUrlByResourceId(id, {absolute: true});
        /**
         * CASE: admin api should serve preview urls
         *
         * @NOTE
         * The url service has no clue of the draft/scheduled concept. It only generates urls for published resources.
         * Adding a hardcoded fallback into the url service feels wrong IMO.
         *
         * Imagine the site won't be part of core and core does not serve urls anymore.
         * Core needs to offer a preview API, which returns draft posts.
         * That means the url is no longer /p/:uuid, it's e.g. GET /api/content/preview/:uuid/.
         * /p/ is a concept of the site, not of core.
         *
         * The site is not aware of existing drafts. It won't be able to get the uuid.
         *
         * Needs further discussion.
         */
        if (!localUtils.isContentAPI(frame)) {
            if (attrs.status !== 'published' && attrs.url.match(/\/404\//)) {
                if (attrs.posts_meta && attrs.posts_meta.email_only) {
                    attrs.url = urlUtils.urlFor({
                        relativeUrl: urlUtils.urlJoin('/email', attrs.uuid, '/')
                    }, null, true);
                } else {
                    attrs.url = urlUtils.urlFor({
                        relativeUrl: urlUtils.urlJoin('/p', attrs.uuid, '/')
                    }, null, true);
                }
            }
        }
    }

    if (frame.options.columns && !frame.options.columns.includes('url')) {
        delete attrs.url;
    }

    return attrs;
};

const forUser = (id, attrs, options) => {
    if (!options.columns || (options.columns && options.columns.includes('url'))) {
        attrs.url = urlService.getUrlByResourceId(id, {absolute: true});
    }

    return attrs;
};

const forTag = (id, attrs, options) => {
    if (!options.columns || (options.columns && options.columns.includes('url'))) {
        attrs.url = urlService.getUrlByResourceId(id, {absolute: true});
    }

    return attrs;
};

const forImage = (path) => {
    return urlUtils.urlFor('image', {image: path}, true);
};

module.exports.forPost = forPost;
module.exports.forUser = forUser;
module.exports.forTag = forTag;
module.exports.forImage = forImage;
