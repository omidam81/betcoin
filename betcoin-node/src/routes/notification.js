'use strict';

var express = require('express');

module.exports = function(NotificationController) {
    var router = express.Router({
        mergeParam: true
    });

    var notificationController = new NotificationController();
    router.route('/:noteId?')
        .get(notificationController.read.bind(notificationController))
        .put(notificationController.markRead.bind(notificationController));

    return router;
};
