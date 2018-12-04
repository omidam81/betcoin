
'use strict';

var AccountFactory = function ($http, $location, PlayerApi, BCPlayer) {
    var AccountFactory = {};
    var protocol = PlayerApi.protocol || 'https';
    var urlApi = protocol + '://'+ PlayerApi.hostname + ':' + PlayerApi.port;
    if (PlayerApi.base && PlayerApi.base.length) {
        urlApi += '/' + PlayerApi.base;
    }

    AccountFactory.user = {};

    AccountFactory.verifyAlias = function (alias, callback){
        $http.get(urlApi + '/verify/alias/' + alias)
            .success(function(data){
                return callback(data.exist);
            })
            .error(function() {
                return;
            });
    };

    AccountFactory.verifyAddress = function (address){
        $http.get(urlApi + '/verify/withdrawAddress/' + address)
            .success(function(data){
                if(data.exist) {
                    $location.path('/');
                } else {
                    $location.path('/signup');
                }
            })
            .error(function() {
                return;
            });
    };

    AccountFactory.getChallengeStringForPassword = function (successCallback, failureCallback){
        $http.get(urlApi + '/password/challenge')
            .success(function(res){
                if(successCallback){
                    successCallback(res);
                }
            })
            .error(function(err) {
                if(failureCallback) {
                    failureCallback(err);
                }
            });
    };

    AccountFactory.resetPassword = function (params, successCallback, failureCallback){

        $http.put(urlApi + '/password/reset', params)
            .success(function(){
                successCallback();
            })
            .error(function(err, status) {
                if(failureCallback) {
                    failureCallback(err, status);
                }
            });
    };

    AccountFactory.login = function (alias, password, successCallback, failureCallback){
        return BCPlayer.login(alias, password).then(function(user) {
            AccountFactory.user = user;
            if(successCallback){
                successCallback(user);
            }
        }, function(error) {
            if(failureCallback){
                failureCallback(error);
            }
        });
    };

    AccountFactory.getChallengeString = function(){
        BCPlayer.User.getChallenge({}, function(data){
            AccountFactory.user.challenge = data.challenge;
        });
    };

    AccountFactory.read = function (id) {
        return AccountFactory.data[id];
    };

    AccountFactory.update = function (){

    };

    AccountFactory.checkAuth = function(){

    };

    /*verify section*/

    AccountFactory.changeemailaddress = function(emailaddress, successCallback, failureCallback){
         var params = {
            email: emailaddress
        };
        $http.put(urlApi + '/resend-email', params)
            .success(function(){
                successCallback();
            })
            .error(function(err, status) {
                if(failureCallback) {
                    failureCallback(err, status);
                }
            });

    };

    /**/
    AccountFactory.resendEmail = function(successCallback, failureCallback){
        
        $http.put(urlApi + '/resend-email')
            .success(function(){
                successCallback();
            })
            .error(function(err, status) {
                if(failureCallback) {
                    failureCallback(err, status);
                }
            });

    };


    return AccountFactory;
};

Application.Services.factory("AccountFactory", ["$http", "$location", "PlayerApi", "BCPlayer", AccountFactory]);
