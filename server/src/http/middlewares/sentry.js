const { isEmpty } = require("lodash");
const logger = require("../../common/logger");
const config = require("../../config");
const { init, captureException, configureScope } = require("@sentry/node");

module.exports = () => {
  const isEnabled = !isEmpty(config.sentry.dsn);

  if (isEnabled) {
    init({ dsn: config.sentry.dsn, environment: config.env, tracesSampleRate: 1.0 });
  }

  return {
    sendError: (e, opts = {}) => {
      const req = opts.req;
      const options = req
        ? {
            user: {
              ...(req.user ? { id: req.user.username } : {}),
              ip_address: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
            },
          }
        : {};

      if (isEnabled) {
        if (options) {
          configureScope((scope) => {
            if (options.user) {
              scope.setUser(options.user);
            }
          });
        }
        captureException(e);
      } else {
        logger.error(e, "[SENTRY] An error occurred", options);
      }
    },
  };
};
