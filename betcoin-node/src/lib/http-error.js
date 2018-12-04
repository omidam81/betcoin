'use strict';

var util = require('util');
var STATUS_CODES = require('http').STATUS_CODES;

module.exports = function(logger, locales) {
    var HTTPError = function(code) {
        var message = Array.prototype.slice.call(arguments, 1);
        if (arguments.length === 1 && code instanceof Error) {
            message = [code.message];
            code = code.code;
        }
        if (STATUS_CODES.hasOwnProperty(code)) {
            this.code = code;
        } else {
            this.code = 500;
        }
        if (message.length) {
            this.message = util.format.apply(util.format, message);
            this.messageArgs = message;
        } else {
            this.message = STATUS_CODES[this.code];
            this.messageArgs = [this.message];
        }
        // set name and type like the other node errors
        this.name = 'HTTPError';
        this.type = STATUS_CODES[this.code]
            .toLowerCase()
            .replace(/ /g, '_')
            .replace(/'/g, '');
    };

    util.inherits(HTTPError, Error);

    HTTPError.prototype.send = function(res) {
        if (!res.headersSent) {
            var resObj = {
                error: STATUS_CODES[this.code],
                message: this.message
            };
            res.locals.error = this;
            return res.status(this.code).json(resObj);
        } else {
            throw "headers already sent!";
        }
    };

    HTTPError.prototype.localize = function(locale) {
        if (!locales[locale]) {
            return;
        }
        var thisLocale = locales[locale];
        logger.verbose("localizing error with to %s", locale);
        var newMessageArgs = [];
        this.messageArgs.forEach(function(messageArg, index) {
            var localized = messageArg;
            if (index === 0) {
                if (thisLocale.messages[messageArg])
                    localized = thisLocale.messages[messageArg];
            } else {
                if (thisLocale.fillers[messageArg])
                    localized = thisLocale.fillers[messageArg];
            }
            newMessageArgs[index] = localized;
        });
        this.message = util.format.apply(util.format, newMessageArgs);
    };

    return HTTPError;

};
