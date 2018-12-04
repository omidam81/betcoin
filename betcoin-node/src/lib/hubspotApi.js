'use strict';

var http = require('https');
var async = require('async');
var moment = require('moment');

module.exports = function(logger, HTTPError, container){
    var HubspotApi = function() {
    };

    var apiKey = process.env.HUBSPOT_KEY;
    if (!apiKey) {
        logger.warn('no hubspot key found');
    }
    HubspotApi.APIKeys = apiKey;
    HubspotApi.baseAPIaddress = "api.hubapi.com";

    var doApiCall = function() {
        var args = Array.prototype.slice.call(arguments);
        var cb = args.pop();
        var url = args[0];
        var options = args[1] || {method: 'GET'};
        var data = args[2] || false;
        options.hostname = HubspotApi.baseAPIaddress;

        if (url.indexOf('?') >=0) {
            url += '&';
        } else {
            url += '?';
        }
        url += "hapikey=" + HubspotApi.APIKeys;
        options.path = url;
        options.headers = {
            'Content-Type': 'application/json'
        };
        var req = http.request(options, function(res) {
            var str = "";
            res.on('data', function (chunk) {
                str += chunk;
            });
            res.on('end', function () {
                var value;
                try {
                    value = JSON.parse(str);
                } catch(ex) {
                    logger.error("Bad JSON from HubSpot: %s", str);
                    return cb(new HTTPError(ex));
                }
                if(value.status === 'error') {
                    logger.error(value, {});
                    cb(new HTTPError(res.statusCode, value.message));
                } else {
                    cb(undefined, value);
                }
            });
            res.on("error", function(err) {
                cb(err);
            });
        });
        if (data) req.write(JSON.stringify(data));
        req.on('error', function(err) {
            return cb(err);
        });
        req.end();
    };

    HubspotApi.prototype.getContactbyEmail = function(email, cb){
        var url = "/contacts/v1/contact/email/" + email + "/profile";
        doApiCall(url, cb);
    };


    HubspotApi.prototype.getAllContacts = function(cb){
        var url = "/contacts/v1/lists/all/contacts/all";
        doApiCall(url, cb);
    };

    HubspotApi.prototype.addOrUpdateContact = function(userObj, cb){
        var email = userObj.email() ? userObj.email() : userObj.pendingEmail();
        var username = userObj.username();
        var url = "/contacts/v1/contact/createOrUpdate/email/" + email;
        var dataToSend = {
            "properties": [{
                "property": "email",
                "value": email
            }, {
                "property": "username",
                "value": username
            }, {
                "property": "btc_deposit_address",
                "value": userObj.btcWallet.depositAddress()
            }, {
                "property": "locale",
                "value": userObj.locale()
            }]
        };
        if (userObj.btcWallet.lastDepositAt()) {
            var lastDepositDate = moment(userObj.btcWallet.lastDepositAt());
            lastDepositDate = lastDepositDate.startOf('day').valueOf();
            dataToSend.properties.push({
                "property": "last_btc_deposit",
                "value": lastDepositDate
            });
        }
        var options = {
            method: 'POST'
        };
        doApiCall(url, options, dataToSend, cb);
    };

    HubspotApi.prototype.clearUserFromLists = function(contact, cb) {
        var id = contact.vid;
        var lists = contact['list-memberships'];
        async.each(lists, function(list, done) {
            var url = "/contacts/v1/lists/" + list['static-list-id'] + "/remove";
            var  contacts =  {
                "vids": [
                    id
                ]
            };
            var  options = {
                method: 'POST'
            };
            doApiCall(url, options, contacts, function(err) {
                if (err) {
                    if (err.message === 'Can not operate manually on a dynamic list') {
                        // that's cool, just go on man
                        return done();
                    }
                    return done(err);
                }
                return done();
            });
        }, cb);
    };

    HubspotApi.prototype.addContactToList = function(contactId, list, cb){
        var self = this;
        var url = '/contacts/v1/contact/vid/' + contactId + '/profile';
        doApiCall(url, function(err, user) {
            if (err) return cb(err);
            self.clearUserFromLists(user, function(err) {
                if (err) return cb(err);
                if (cb === undefined && 'function' === typeof list) {
                    cb = list;
                    list = undefined;
                }
                if (list === undefined) list = 10; // default to customers list
                var url = "/contacts/v1/lists/" + list + "/add";
                var  contacts =  {
                    "vids": [
                        contactId
                    ]
                };
                var  options = {
                    method: 'POST'
                };
                doApiCall(url, options, contacts, cb);
            });
        });
    };

    HubspotApi.prototype.addContact = function(userId, list, cb){
        if (cb === undefined && 'function' === typeof list) {
            cb = list;
            list = undefined;
        }
        var self = this;
        var User = container.get('User');
        User.get(userId, function(err, user) {
            if (err) return cb(err);
            user.wallet('bitcoin', function(err, btcWallet) {
                if (err) return cb(err);
                user.btcWallet = btcWallet;
                self.addOrUpdateContact(user, function(err, contact){
                    if (err) return cb(err);
                    if ('function' === typeof list) {
                        list = list(user);
                    }
                    if (list === false) {
                        return cb();
                    }
                    self.addContactToList(contact.vid, list, cb);
                });
            });
        });
    };

    return HubspotApi;

};
