// ### prevNext helper exposes methods for prev_post and next_post - separately defined in helpers index.
//  Example usages
// `{{#prev_post}}<a href ="{{url}}>previous post</a>{{/prev_post}}'
// `{{#next_post}}<a href ="{{url absolute="true">next post</a>{{/next_post}}'
const {hbs} = require('../services/handlebars');
const {checks} = require('../services/data');

const logging = require('@tryghost/logging');
const tpl = require('@tryghost/tpl');

const messages = {
    mustBeCalledAsBlock: 'The {\\{{helperName}}} helper must be called as a block. E.g. {{#{helperName}}}...{{/{helperName}}}'
};

const createFrame = hbs.handlebars.createFrame;

// If prevNext method is called without valid post data then we must return a promise, if there is valid post data
// then the promise is handled in the api call.

/**
 * @param {*} options
 * @returns {hbs.SafeString}
 */
module.exports = function prevNext(options) {
    options = options || {};

    const data = createFrame(options.data);
    const context = options.data.root.context;

    // Guard against incorrect usage of the helpers
    if (!options.fn || !options.inverse) {
        data.error = tpl(messages.mustBeCalledAsBlock, {helperName: options.name});
        logging.warn(data.error);
        return;
    }

    if (context.includes('preview')) {
        return options.inverse(this, {data: data});
    }

    // Guard against trying to execute prev/next on pages, or other resources
    if (!checks.isPost(this) || this.page) {
        return options.inverse(this, {data: data});
    }

    return new hbs.SafeString('WUT AM I?');
};

module.exports.alias = 'next_post';
