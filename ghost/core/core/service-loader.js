const debug = require('@tryghost/debug')('boot:service-loader');

module.exports = async function serviceLoader({config}) {
    debug('Begin: initServices');

    debug('Begin: Services');
    const stripe = require('./server/services/stripe');
    const members = require('./server/services/members');
    const tiers = require('./server/services/tiers');
    const permissions = require('./server/services/permissions');
    const xmlrpc = require('./server/services/xmlrpc');
    const slack = require('./server/services/slack');
    const webhooks = require('./server/services/webhooks');
    const limits = require('./server/services/limits');
    const apiVersionCompatibility = require('./server/services/api-version-compatibility');
    const scheduling = require('./server/adapters/scheduling');
    const comments = require('./server/services/comments');
    const staffService = require('./server/services/staff');
    const memberAttribution = require('./server/services/member-attribution');
    const membersEvents = require('./server/services/members-events');
    const linkTracking = require('./server/services/link-tracking');
    const audienceFeedback = require('./server/services/audience-feedback');
    const emailSuppressionList = require('./server/services/email-suppression-list');
    const emailService = require('./server/services/email-service');
    const emailAnalytics = require('./server/services/email-analytics');
    const mentionsService = require('./server/services/mentions');
    const mentionsEmailReport = require('./server/services/mentions-email-report');
    const tagsPublic = require('./server/services/tags-public');
    const postsPublic = require('./server/services/posts-public');
    const slackNotifications = require('./server/services/slack-notifications');
    const mediaInliner = require('./server/services/media-inliner');
    const collections = require('./server/services/collections');
    const modelToDomainEventInterceptor = require('./server/services/model-to-domain-event-interceptor');
    const mailEvents = require('./server/services/mail-events');
    const donationService = require('./server/services/donations');
    const recommendationsService = require('./server/services/recommendations');

    const urlUtils = require('./shared/url-utils');

    // NOTE: limits service has to be initialized first
    // in case it limits initialization of any other service (e.g. webhooks)
    await limits.init();

    // NOTE: Members service depends on these
    //       so they are initialized before it.
    await stripe.init();

    await Promise.all([
        memberAttribution.init(),
        mentionsService.init(),
        mentionsEmailReport.init(),
        staffService.init(),
        members.init(),
        tiers.init(),
        tagsPublic.init(),
        postsPublic.init(),
        membersEvents.init(),
        permissions.init(),
        xmlrpc.listen(),
        slack.listen(),
        audienceFeedback.init(),
        emailService.init(),
        emailAnalytics.init(),
        webhooks.listen(),
        apiVersionCompatibility.init(),
        scheduling.init({
            apiUrl: urlUtils.urlFor('api', {type: 'admin'}, true)
        }),
        comments.init(),
        linkTracking.init(),
        emailSuppressionList.init(),
        slackNotifications.init(),
        collections.init(),
        modelToDomainEventInterceptor.init(),
        mediaInliner.init(),
        mailEvents.init(),
        donationService.init(),
        recommendationsService.init()
    ]);
    debug('End: Services');

    // Initialize analytics events
    if (config.get('segment:key')) {
        require('./server/services/segment').init();
    }

    debug('End: initServices');
};
