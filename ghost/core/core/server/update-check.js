const _ = require('lodash');

const api = require('./api').endpoints;
const logging = require('@tryghost/logging');
const config = require('../shared/config');
const urlUtils = require('./../shared/url-utils');
const databaseInfo = require('./data/db/info');

const request = require('@tryghost/request');
const ghostVersion = require('@tryghost/version');
const UpdateCheckService = require('@tryghost/update-check-service');

/**
 * Initializes and triggers update check
 * @param {Object} [options]
 * @param {Boolean} [options.rethrowErrors] - if true, errors will be thrown instead of logged
 * @param {Boolean} [options.forceUpdate] - if true, the update check will be triggered regardless of the environment or scheudle, defaults to config if no value provided
 * @param {String} [options.updateCheckUrl] - the url to check for updates against, defaults to config if no value provided
 * @returns {Promise<any>}
 */
const updateCheck = async ({
    rethrowErrors = false,
    forceUpdate = config.get('updateCheck:forceUpdate'),
    updateCheckUrl = config.get('updateCheck:url')
} = {}) => {
    if (!forceUpdate) {
        const allowedCheckEnvironments = ['development', 'production'];

        // CASE: The check will not happen if your NODE_ENV is not in the allowed defined environments
        if (_.indexOf(allowedCheckEnvironments, process.env.NODE_ENV) === -1) {
            return;
        }
    }

    const {GhostMailer} = require('./services/mail');
    const ghostMailer = new GhostMailer();

    const updateChecker = new UpdateCheckService({
        api: {
            settings: {
                read: api.settings.read,
                edit: api.settings.edit
            },
            posts: {
                browse: api.posts.browse
            },
            users: {
                browse: api.users.browse
            },
            notifications: {
                add: api.notifications.add
            }
        },
        config: {
            mail: config.get('mail'),
            env: config.get('env'),
            databaseType: databaseInfo.getEngine(),
            checkEndpoint: updateCheckUrl,
            isPrivacyDisabled: config.isPrivacyDisabled('useUpdateCheck'),
            notificationGroups: config.get('notificationGroups'),
            siteUrl: urlUtils.urlFor('home', true),
            forceUpdate,
            ghostVersion: ghostVersion.original,
            rethrowErrors
        },
        request,
        sendEmail: ghostMailer.send.bind(ghostMailer)
    });

    await updateChecker.check();
};

module.exports = updateCheck;

module.exports.scheduleRecurringJobs = () => {
    const callUpdateCheck = async () => {
        try {
            logging.info('Running update check');
            await updateCheck({
                rethrowErrors: true
            });
            logging.info('Ran update check');
        } catch (error) {
            logging.error({
                message: 'Failed to run update check',
                error
            });
        }
    };

    const firstRunMs = 5000; // Math.floor(Math.random() * 1000 * 60 * 60 * 24);
    const firstRunTime = new Date(Date.now() + firstRunMs);
    logging.info(`Scheduled first run of update check for ${firstRunTime}`);
    setTimeout(() => {
        callUpdateCheck();
        setInterval(callUpdateCheck, 1000 * 60 * 60 * 24).unref();
    }, firstRunMs).unref();
};
