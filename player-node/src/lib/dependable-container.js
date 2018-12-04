'use strict';

var dependable = require('dependable');

module.exports = function() {
    this.initContainer = function() {
        var container = dependable.container();
        container.register('bitcoind', require('bitcoin-wallet'));

        var mongo = require('./mongo');
        container.register('mongo', mongo);
        container.register('logger', function() { return require('logger-npm')(); });

        var Utils = require('./utils');
        var utils = new Utils();
        utils.setContainer(container);
        container.register('utils', utils);

        var Notification = require('./notification');
        var notification = new Notification();
        notification.setContainer(container);
        container.register('notification', notification);

        var EmailService = require('./mailer');
        container.register('mailer', new EmailService());

        container.register('constants', require('./constants'));
        container.register('namespace', 'account');
        container.register('socket', require('socket-npm'));

        var AdminService = require('./admin');
        var adminService = new AdminService();
        adminService.setContainer(container);
        container.register('admin', adminService);

        return container;
    };
};
