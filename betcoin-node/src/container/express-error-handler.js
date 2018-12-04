'use strict';

module.exports = function(logger, HTTPError) {
    return function localizeError(err, req, res, next) {
        if (err) {
            if (err.name !== "HTTPError") {
                logger.error("Non HTTPError: %s", err, {});
                err = new HTTPError(500);
            }
            if (req.locale !== 'en_US') {
                err.localize(req.locale);
            }
            return err.send(res);
        }
        return next();
    };
};
