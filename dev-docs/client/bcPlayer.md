# bcPlayer Module #

## Installation ##

This script is copied in with all the other common files during the
grunt build process. It will be located at
`${DOCUMENT_ROOT}/js/lib/angular-bc-player.js`

## Usage ##

Add this module to the app dependency list, and configure the api

```javascript

angular.module('Application', ['bcPlayer']).configure(['BCPlayerProvider', function(BCPlayerProvider) {
    BCPlayerProvider.serverConfig({
        hostname: "localhost",
        port: 441,
        scheme: "https"
    });
}]).controller('AppController', ['BCPlayer', function(BCPlayer) {
    BTCPlayer.login("alias", "password").then(function(data) {
        console.log(data.user);
    }, function(error) {
        console.error(error)
    });
}]);

```

## Module Components ##

### BCPlayerProvider ###

### Methods ###

`BCPlayerProvider.serverConfig(newConfig)`

Set the config for the player serverConfig, the default values being:

```javascript
{
    hostname: 'localhost',
    port: 8443,
    scheme: 'https',
    base: ''
}
```

`BCPlayerProvider.cookieName(newCookieName)`

Set the name for the cookie for the API Token, defaults to `'api-token'`

`BCPlayerProvider.publicPaths(paths)`

Set paths that do not require authentication for checking with `BCPlayer.isPublic(path)`

This takes an array of paths beginning with `'/'`, and only the first segment is checked by `BCPlayer.isPublic()`

### BCPlayer ###

`BCPlayer` is an angular `$scope` object, mainly for the purpose of emitting and binding of events

### Properties ###

`BCPlayer.url` - The url created from the server config

`BCPlayer.resourceUrl` - The url for angular resources generated from the server config

`BCPlayer.publicPaths` - The array of paths that do not require authentication

`BCPlayer.User` - An [angular resource](http://code.angularjs.org/1.2.13/docs/api/ngResource.$resource) object pointed at the user API

`BCPlayer.socket` - A [websocket](http://socket.io)

### Methods ###

`BCPlayer.login(alias, password)`

Logs in a user, automatically setting `BCSession.token` and `BCSession.user`

Returns a [promise object](http://code.angularjs.org/1.2.13/docs/api/ng.$q)

`BCPlater.logout()`

Log out the user and clear their token from the cookiestore

Returns a [promise object](http://code.angularjs.org/1.2.13/docs/api/ng.$q)

`BCPlayer.socketSubscribe()`

Subscribe to the websocket notifications

`BCPlayer.onMessage(cb)`

Call `cb` when the socket recieves a message (note: this is *only* messages in the sense of our player server, not *all* socket messages)

`BCPlayer.onMessageUnreadCount(bc)`

Call `cb` when the unread message count is updated

`isPublic(path)`

Returns true or false if the path given is public or requires
authentication. The module does not *do* anything if it is not public,
this is just for checking

### Events ###

bind to these with `BCPlayer.$on('event name', function(event, arg1, arg2, ... argn) {});`

`'user update' (user)` - emitted when the user object is updated in any way by the server

`'deposit' (refId, amount, user)` - emitted when a deposit is received for the user 

### BCSession ###

This contains all the information about the current player session

### Properties ###

`BCSession.token` - The current token

`BCSession.user` - The current user

`BCSession.cookieName` - The cookie name where the token is stored

### $http interceptors ###

This module also sets up $http interceptors that automatically take
care of supplying and extracting the API-Token from any requests.


## Reference Implementation ##

This module is used extensivly in
[`common-ng`](https://bitbucket.org:betcn/common-ng) and
[`home-ng`](https://bitbucket.org:betcn/home-ng)

Use this for further examples of how to use this module

