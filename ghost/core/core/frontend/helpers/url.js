// # URL helper
// Usage: `{{url}}`, `{{url absolute="true"}}`
//
// Returns the URL for the current object scope i.e. If inside a post scope will return post permalink
// `absolute` flag outputs absolute URL, else URL is relative

const {metaData} = require('../services/proxy');
const {SafeString} = require('../services/handlebars');
const logging = require('@tryghost/logging');
const sentry = require('../../shared/sentry');
const errors = require('@tryghost/errors');

const {getMetaDataUrl} = metaData;

module.exports = function url(options) {
    const absolute = options && options.hash.absolute && options.hash.absolute !== 'false';
    let outputUrl;
    if (options.data.root.settings.router) {
        // DIRTY HACK for Routing 2.0 - Just so we can change code in as few places as possible
        const router = options.data.root.settings.router;
        outputUrl = router.urlFor(this);
    } else {
        outputUrl = getMetaDataUrl(this, absolute);
    }

    try {
        outputUrl = encodeURI(decodeURI(outputUrl)).replace(/%5B/g, '[').replace(/%5D/g, ']');
    } catch (err) {
        // Happens when the outputURL contains an invalid URI character like "%%" or "%80"

        // Send the error not to be blind to these
        const error = new errors.IncorrectUsageError({
            message: `The url "${outputUrl}" couldn't be escaped correctly`,
            err: err
        });
        sentry.captureException(error);
        logging.error(error);

        return new SafeString('');
    }

    return new SafeString(outputUrl);
};
