var restClient = require("node-rest-client").Client;

module.exports.generateService = function(App) {
    var client = new restClient();
    var service = {};


    var registerService = function(name, address, method, defaultArgs) {
        client.registerMethod(name, App.data.playerServerUrl + address, method);

        service[name] = function(args, callback, errorCallback) {
            client.methods[name](function(data){
                // do some logging here
                callback(data);
            }).on('error',function(data){
                // do some logging here

                    //@TODO
                    /*if(data && data.data && data.data.error) {
                        console.error(data.data);
                        return (data.data.code ? data.data.code : "") + " " + data.data.error  + ((data.data.message && data.data.message !== data.data.error) ? ": " + data.data.message : "");
                    } else {
                        console.error(data);
                        $scope.error.showServer = true;
                        if(data.status == "401") {
                            $scope.error.server = "Authorization Error. Please sign in.";
                            $scope.loggedOut();
                        } else if(data.status == "500") {
                            $scope.error.server = "Internal server error. Please contact us if this problem persists.";
                        } else {
                            $scope.error.server = "A connection to the game server could not be established. Please check your connection and sign in again, or contact us if this problem persists.";
                        }
                        return true;
                    }
*/
                errorCallback(data);
            });
        }
    }

    // registering remote methods
    registerService("captcha", "captcha", "GET"); //it was disabled in player-server
    registerService("signup", "signup", "POST");
    registerService("login", "login", "POST");
    registerService("logout", "logout", "POST");
    registerService("getChallengeSignature", "users/sig", "PUT");
    registerService("getAllUsers", "users", "POST");
    registerService("getUserInfo", "users/${alias}", "POST");
    registerService("setUserAlias", "users/alias", "PUT");
    registerService("setUserPassword", "users/password", "PUT");
    registerService("setUserAddress", "users/addr", "PUT");
    registerService("withdraw", "users/withdraw", "PUT");
    registerService("requestAffiliate", "users/request-affiliate/${currency}", "PUT");
    registerService("checkFaucet", "users/faucet/${currency}", "PUT");
    registerService("getTransactionHistory", "txs/${currency}", "GET");
    registerService("getUserTransactionHistory", "txs/${alias}/${currency}", "GET");
    registerService("addTransaction", "txs/", "POST");

    return service;
}