'use strict';

var MessageController = function($scope, $rootScope, $location, BCPlayer, BCSession, MessageFactory) {
    $scope.inbox_messages = MessageFactory.data;

    $scope.refresh = function() {
        MessageFactory.refresh(function(messages){
            $scope.inbox_messages = messages;
        });
    };

    if (BCSession.user) {
        $scope.refresh();
    } else {
        BCPlayer.$on('user update', function() {
            $scope.refresh();
        });
    }
    $rootScope.register = false;
    $rootScope.home = false;
    $rootScope.account = true;

    $scope.sendSupportMessage = function(){
        BCPlayer.User.sendSupportEmail({}, {subject: $scope.subject, message: $scope.message});
        $rootScope.$broadcast('new notification', {type: 'message_sent'});
        $location.path('/account');
    };

    $scope.markRead = function(){
        var self = this;
        if(this.message.hasRead === true){
            return;
        }
        this.message.hasRead = true;
        BCPlayer.Notification.markMessageRead({noteId: this.message._id}, function(){
            MessageFactory.dismiss(self.message._id);
            $scope.inbox_messages = MessageFactory.data;
        });
    };

    // $scope.dismiss = function(){
    //     var message = this.message;
    //     BCPlayer.Noticication.dismissMessage({targetId: message.id}, function(){
    //         MessageFactory.dismiss(message.id);
    //         $scope.inbox_messages = MessageFactory.data;
    //     });
    // };
};

Application.Controllers.controller('MessageController', [
    "$scope",
    "$rootScope",
    "$location",
    "BCPlayer",
    "BCSession",
    "MessageFactory",
    MessageController
]);

