'use strict';

module.exports = function(HTTPError, logger, CURRENCY_REGEXP) {
    return function(req, res, next) {
        var currency = req.get('x-currency');
        if (currency === undefined) {
            return next(new HTTPError(400, 'Missing currency header'));
        }
        if (currency && CURRENCY_REGEXP.test(currency)) {
            req.currency = currency.toLowerCase();
        } else {
            return next(new HTTPError(400, 'Invalid currency %s', currency));
        }
        // check common keys for valid currency types
        if (req.query.currency) {
            if (req.query.currency !== 'all' && !CURRENCY_REGEXP.test(req.query.currency)) {
                return next(new HTTPError(400, 'Invalid currency %s', req.query.currency));
            }
        }
        var badKeyFound = false;
        ['addresses'].forEach(function(bodyKey) {
            var value = req.body[bodyKey];
            if (value && 'object' === typeof value) {
                Object.keys(value).forEach(function(currKey) {
                    if (!CURRENCY_REGEXP.test(currKey)) {
                        // only return response once, or express will shit a brick
                        if (!badKeyFound) {
                            badKeyFound = true;
                        }
                    }
                });
            }
            if (badKeyFound) {
                return next(new HTTPError(400, 'Invalid currency'));
            } else {
                return next();
            }
        });
    };
};
