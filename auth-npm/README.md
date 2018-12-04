# Betcoin Auth #

Use this module for authenticating users within backoffice and support
apps. Designed for use with express

## Usage ##

Takes a mongo collection and optional config override

Example using mongowrap to get the collection

```javascript
var bcauth = require('bc-auth');

mongo.getCollection('officedb', 'users', function(err, collection) {
    if (err) throw err;
    var auth = bcauth(collection);
    app.get('/auth', auth.getToken);
    app.get('/logout', auth.destroyToken);
    app.get('/protected', auth.checkToken, function(req, res) {
        // this sets req.user to the user object returned from the database
        res.json(req.user);
    });
});
```

The optional config object can iverride the fields used on the user
record to get the info, and to set the response header containing the
token. The defaults are:

```javascript
{
    username: 'username',
    password: 'password',
    token: 'token',
    header: 'API-Token'
}
```

At this time, if you pass in a config object, it must contain all of
these values. Use the defaults unless you have a really good reson not
to

There is also a method `bcauth.passwordHash()` that will return a
password has for the given password. Use this to generate passwords if
you need to

```javascript
var bcauth = require('bc-auth');
bcauth.hashPassword('mypassword', function(err, hash) {
    if (err) throw err;
    user.password = hash;
});
```
