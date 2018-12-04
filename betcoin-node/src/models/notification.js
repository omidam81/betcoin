'use strict';

var timestamps = require('modella-timestamps');
var util = require('util');

module.exports = function(BaseModel, userModelStore) {
    var Notification = BaseModel('notification')
        .attr('userId', {type: userModelStore.ObjectId})
        .attr('readAt', {type: Date})
        .attr('subject', {type: 'string', defaultValue: "Notification from BetCoin"})
        .attr('message', {type: 'string'});

    Notification.use(userModelStore);
    Notification.use(timestamps);

    Object.defineProperty(Notification.prototype, 'beenRead', {
        get: function() { return this.has('readAt'); },
        set: function(set) {
            if (set) {
                this.readAt(util.isDate(set) ? set : new Date());
            }
        }
    });

    return Notification;

};
