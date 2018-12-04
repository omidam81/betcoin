# Player Interface #

This module exists for game server APIs to talk to the master player server.

If you are running the player API in dev mode, you do not need to
worry about setting the APP_KEY environment variable to anything
meaningful, since the `bc-player` bypasses a real app key check in dev
mode

When this script is required by your app, it requires you to set two
environment variables when running.

- `PLAYER_SERVER_PORT_441_TCP=tpc://player-server-host:441` The
  location of your player server instance
- `APP_KEY='foobarappkey'` This can be anything for dev. If you ever
  need to deploy this live, then you will know what to do from the
  appropriate deployment documentation

You can do this by running your node app like so:

```sh
# in $HOME/player-env.sh

export PLAYER_SERVER_PORT_441_TCP=tpc://player-server-host:441
export APP_KEY='foobarappkey'
```

```sh
source $HOME/player-env.sh && node app
```

## Note ##

All amounts are expressed in Satoshi. Use the 'bitcoin-math' module to
convert a decimal value to Satoshi without having issues with
javascript's integer division qwirks

```sh
npm install --save bitcoin-math
```

```javascript
require('bitcoin-math');

assert((0.00065535).toSatoshi() === 65535)
```

## Usage ##

Install the module to your project

```sh
npm install --save git+ssh://git@bitbucket.org:betcn/player-interface-node
```

in `your-game-server/app.js`

```javascript
var PlayerInterface = require('player-interface-node');

PlayerInterface.credit("USER_ID", 65535, {
    type: "your-game-name:winnings",
    refId: "BET_OR_GAME_ID",
    currency: 'btc',
    meta: {
        extraInfo: "foobar"
    }
}, function(err, transactionId) {
    if (err) throw err;
    console.log("transaction id: %s", transactionId.toHexString());
});
```


## Interface Methods ##

### `PlayerInterface.credit(userId, amount, options, cb)` ###


Params:

- userId (string|ObjectID): a mongo ObjectId for the user
- amount (int): the amont to credit the account (in Satoshi)
- options (Object): an object containing
  - type (string): the type of transaction (ususally the name of the product)
  - refId (string): the id of the thing sending this transaction (like
    the game/bet id that was played)
  - currency (string): currently only `'btc'` is supported
  - meta _optional_ (Object): any extra info in a one level object
    (nothing nested, yahear!)
- cb: callback, function(err, transactionId) {} where transactionId is
  the Mongo ObjectID of the new transaction


### `PlayerInterface.debit(userId, amount, options, cb)` ###


Params:

- userId (string|ObjectID): a mongo ObjectId for the user
- amount (int): the amont to debit the account (in Satoshi)
- options (Object): an object containing
  - type (string): the type of transaction (ususally the name of the product)
  - refId (string): the id of the thing sending this transaction (like
    the game/bet id that was played)
  - currency (string): currently only `'btc'` is supported
  - meta _optional_ (Object): any extra info in a one level object
    (nothing nested, yahear!)
- cb: callback, function(err, transactionId) {} where transactionId is
  the Mongo ObjectID of the new transaction

### `PlayerInterface.verifyToken(userId, token, cb)` ###


Params:


- userId (string|ObjectID): a mongo ObjectId for the user
- token (string): The token to check for the userId
- cb (Function): callback, function(err, isValid) where isValid is true or false


## Express Middleware ##

### `PlayerInterface.extractApiToken` ###

Extracts the API-Token header value into req.token.

If the `Authorization` header is missing the token will be set to
false.

If the token is malformed (meaning the `Authorization` header is
present, but the value does not match `/^Bearer [a-f0-9]{32}/` regexp), then a 400
error will be returned to the request directly.

```javascript
app.use(PlayerInterface.extractApiToken);

app.get('/foo', function(req, res) {
    PlayerInterface.verifyToken(req.body.userId, req.token, function(err, isValid) {
        if (err) res.send(500, err.message);
        if (isValid) {
            // the token is good
        } else {
            res.send(401);
        }
    });
});
```

