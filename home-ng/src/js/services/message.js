'use strict';

var MessageFactory = function ($cookieStore, BCPlayer) {
    var MessageFactory = {data:[]};
    
    MessageFactory.refresh = function (cb){
        BCPlayer.User.getNotifications({}, function(res){
            MessageFactory.data = res.data;
            cb(MessageFactory.data);
        });
    };

    MessageFactory.create = function (){

    };

    MessageFactory.reads = function (){
        return MessageFactory.data;
    };

    MessageFactory.read = function (id) {
        for(var i in MessageFactory.data){
            if(MessageFactory.data[i].id === id){
                return MessageFactory.data[i];
            }
        }
        // return MessageFactory.data[id];
    };

    MessageFactory.dismiss = function (id) {
        for(var i in MessageFactory.data){
            if(MessageFactory.data[i].id === id){
                MessageFactory.data.splice(i, 1);
                break;
            }
        }
    };

    MessageFactory.update = function (){

    };

    MessageFactory.checkAuth = function(){

    };

    return MessageFactory;
};

Application.Services.factory("MessageFactory", ["$cookieStore", "BCPlayer", MessageFactory]);
