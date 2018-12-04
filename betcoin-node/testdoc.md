[4mRunning "simplemocha:api" (simplemocha) task[24m
# TOC
   - [API](#api)
     - [bitcoin](#api-bitcoin)
       - [UserController](#api-bitcoin-usercontroller)
         - [POST /user](#api-bitcoin-usercontroller-post-user)
         - [GET /user/:userId](#api-bitcoin-usercontroller-get-useruserid)
         - [PUT /user/:userId](#api-bitcoin-usercontroller-put-useruserid)
         - [DELETE /user/:userId](#api-bitcoin-usercontroller-delete-useruserid)
       - [WalletController](#api-bitcoin-walletcontroller)
         - [GET /wallet/challenge](#api-bitcoin-walletcontroller-get-walletchallenge)
         - [POST /wallet/:userId](#api-bitcoin-walletcontroller-post-walletuserid)
         - [GET /wallet/:userId](#api-bitcoin-walletcontroller-get-walletuserid)
         - [PUT /wallet/:userId](#api-bitcoin-walletcontroller-put-walletuserid)
           - [withdraw address update](#api-bitcoin-walletcontroller-put-walletuserid-withdraw-address-update)
           - [set backup address](#api-bitcoin-walletcontroller-put-walletuserid-set-backup-address)
           - [update backup address](#api-bitcoin-walletcontroller-put-walletuserid-update-backup-address)
     - [circle](#api-circle)
       - [GET /circle/next](#api-circle-get-circlenext)
       - [POST /circle](#api-circle-post-circle)
       - [GET /circle/:id](#api-circle-get-circleid)
       - [GET /circle/leaderboard](#api-circle-get-circleleaderboard)
     - [dice](#api-dice)
       - [GET /dice/next](#api-dice-get-dicenext)
       - [POST /dice](#api-dice-post-dice)
       - [GET /dice/:id](#api-dice-get-diceid)
       - [GET /dice/leaderboard](#api-dice-get-diceleaderboard)
     - [blackjack](#api-blackjack)
       - [GET /blackjack/next](#api-blackjack-get-blackjacknext)
       - [POST /blackjack](#api-blackjack-post-blackjack)
       - [GET /blackjack/:id](#api-blackjack-get-blackjackid)
       - [GET /blackjack/leaderboard](#api-blackjack-get-blackjackleaderboard)
<a name=""></a>
 
<a name="api"></a>
# API
should start up.

```js
request.get('/ping').expect(200, 'pong', done);
```

<a name="api-bitcoin"></a>
## bitcoin
<a name="api-bitcoin-usercontroller"></a>
### UserController
<a name="api-bitcoin-usercontroller-post-user"></a>
#### POST /user
should create a new user.

```js
var username = getUsername();
generateNewUserRequest({username: username})
    .expect(201)
    .expect(function(res) {
        var newUser = res.body;
        assert(!newUser.anonymous);
        assert(newUser.token);
        assert.equal(newUser.username, username);
        // password hash is never returned
        assert(!newUser.password);
        assert(newUser.ip);
        assert(!/^172\.17\.42/.test(newUser.ip));
        assert(!newUser.email);
        assert.equal(newUser.pendingEmail, 'test@betcoin.tm');
        assert(newUser.emailToken);
        assert(newUser.affiliateToken);
        assert(newUser.createdAt);
        assert(newUser.updatedAt);
        assert(newUser.upgradedAt);
    })
    .end(done);
```

should create an anonymous user without an email.

```js
generateNewUserRequest({anonymous: true})
    .expect(201)
    .expect(function(res) {
        var newUser = res.body;
        assert(newUser.anonymous);
        assert(newUser.username);
        assert(newUser.ip);
        assert(!/^172\.17\.42/.test(newUser.ip));
        assert(!newUser.email);
        assert(!newUser.pendingEmail);
        assert(!newUser.emailToken);
        assert(!newUser.affiliateToken);
        assert(newUser.createdAt);
        assert(newUser.updatedAt);
        assert(!newUser.upgradedAt);
    })
    .end(done);
```

should reject non matching passwords.

```js
generateNewUserRequest({password: 'password11'})
    .expect(400, /Passwords do not match/, done);
```

should reject short passwords.

```js
generateNewUserRequest({password: 'password', passwordConfirm: 'password'})
    .expect(400, /Invalid password/, done);
```

should reject short usernames.

```js
generateNewUserRequest({username: 'foo'})
    .expect(400, /Invalid username/, done);
```

should reject an invalid email address.

```js
generateNewUserRequest({email: 'foo@bar'})
    .expect(400, /Invalid pendingEmail/, done);
```

should reject duplicate usernames.

```js
generateNewUserRequest().end(function(err, res) {
    var newUser = res.body;
    generateNewUserRequest({username: newUser.username})
        .expect(409, /Username exists/, done);
});
```

<a name="api-bitcoin-usercontroller-get-useruserid"></a>
#### GET /user/:userId
should get a user.

```js
createUser(function(err, newUser) {
    assert.ifError(err);
    generateRequest('get', '/user/' + newUser._id)
        .set('Authorization', 'Bearer ' + newUser.token)
        .expect(200, newUser, done);
});
```

should not get a user without having a token.

```js
generateRequest('get', '/user')
    .expect(400, /no credentials found/, done);
```

should not allow you to get another user.

```js
createUser(function(err, user) {
    if (err) return done(err);
    createUser(function(err, hacker) {
        if (err) return done(err);
        generateRequest('get', '/user/' + user._id)
            .set('Authorization', 'Bearer ' + hacker.token)
            .expect(418, /You cannot access another user/, done);
    });
});
```

<a name="api-bitcoin-usercontroller-put-useruserid"></a>
#### PUT /user/:userId
should update a user's username.

```js
var username = getUsername();
thisRequest.send({username: username})
    .expect(202)
    .expect(function(res) {
        var newUser = res.body;
        assert.equal(newUser.username, username);
    }).end(done);
```

should update a user's password.

```js
var password = 'password11';
thisRequest.send({password: password, passwordConfirm: password})
    .expect(202)
    .expect(function(res) {
        var newUser = res.body;
        assert(!newUser.password); // we do not get the new hash back
    }).end(done);
```

should update a user's email.

```js
var email = 'test2@betcoin.tm';
thisRequest.send({email: email})
    .expect(202)
    .expect(function(res) {
        var newUser = res.body;
        assert.equal(newUser.pendingEmail, email);
        assert.notEqual(newUser.emailToken, user.emailToken);
    }).end(done);
```

should update a user's full info at once.

```js
var email = 'test2@betcoin.tm';
var password = 'password11';
var username = getUsername();
thisRequest.send({
    username: username,
    password: password,
    passwordConfirm: password,
    email: email
})
    .expect(202)
    .expect(function(res) {
        var newUser = res.body;
        assert.equal(newUser.pendingEmail, email);
        assert.notEqual(newUser.emailToken, user.emailToken);
        assert(!newUser.password); // we do not get the new hash back
        assert.equal(newUser.username, username);
    }).end(done);
```

should not allow you to update another user.

```js
createUser(function(err, hacker) {
    if (err) return done(err);
    generateRequest('put', '/user/' + user._id)
        .set('Authorization', 'Bearer ' + hacker.token)
        .send({username: 'foobarman'})
        .expect(418, /You cannot access another user/, done);
});
```

should reject non matching passwords.

```js
thisRequest.send({password: 'password11', passwordConfirm: 'password12'})
    .expect(400, /Passwords do not match/, done);
```

should reject short passwords.

```js
thisRequest.send({password: 'pass', passwordConfirm: 'pass'})
    .expect(400, /Invalid password/, done);
```

should reject short usernames.

```js
thisRequest.send({username: 'foo'})
    .expect(400, /Invalid username/, done);
```

should reject an invalid email address.

```js
thisRequest.send({email: 'foo@barcom'})
    .expect(400, /Invalid pendingEmail/, done);
```

should reject duplicate usernames.

```js
createUser(function(err, newUser) {
    if (err) return done(err);
    thisRequest.send({username: newUser.username})
        .expect(409, /Username exists/, done);
});
```

<a name="api-bitcoin-usercontroller-delete-useruserid"></a>
#### DELETE /user/:userId
should remove a user's token.

```js
createUser(function(err, user) {
    if (err) return done(err);
    generateRequest('delete', '/user/' + user._id)
        .set('Authorization', 'Bearer ' + user.token)
        .expect(200, done);
});
```

should not allow you to log out another user.

```js
createUser(function(err, user) {
    if (err) return done(err);
    createUser(function(err, hacker) {
        if (err) return done(err);
        generateRequest('delete', '/user/' + user._id)
            .set('Authorization', 'Bearer ' + hacker.token)
            .expect(418, /You cannot access another user/, done);
    });
});
```

<a name="api-bitcoin-walletcontroller"></a>
### WalletController
<a name="api-bitcoin-walletcontroller-get-walletchallenge"></a>
#### GET /wallet/challenge
should get a challenge string for the user.

```js
request.get('/wallet/challenge')
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .expect(200, /[a-zA-Z0-9]{32}/, done);
```

<a name="api-bitcoin-walletcontroller-post-walletuserid"></a>
#### POST /wallet/:userId
should create a new wallet.

```js
var address = ADDRESSES[COIN].player.address;
var signature = ADDRESSES[COIN].player.signature;
request.post('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        address: address,
        signature: signature
    })
    .expect(201)
    .expect(function(res) {
        assert.ok(res.body.deposit);
        assert.equal(res.body.playerId, undefined);
        assert.equal(res.body.withdraw, address);
    })
    .end(done);
```

should fail if the user has not gotten a challenge string.

```js
var address = ADDRESSES[COIN].player.address;
var signature = ADDRESSES[COIN].player.signature;
user.challenge('');
user.save(function(err) {
    assert.ifError(err);
    request.post('/wallet/' + user.primary())
        .set('X-Currency', COIN)
        .set('Authorization', 'Bearer ' + user.token())
        .send({
            address: address,
            signature: signature
        })
        .expect(412, /You must get a message to sign first/, done);
});
```

should fail if missing an address.

```js
var signature = ADDRESSES[COIN].player.signature;
request.post('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        signature: signature
    })
    .expect(400, /Missing address/, done);
```

should fail if missing a signature.

```js
var address = ADDRESSES[COIN].player.address;
request.post('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        address: address
    })
    .expect(400, /Missing signature/, done);
```

should fail if the signature is invalid.

```js
var address = ADDRESSES[COIN].player.address;
var signature = ADDRESSES[COIN].player.signature.replace(/[\/+]/, "");
request.post('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        address: address,
        signature: signature
    })
    .expect(400, /Malformed base64 encoding/, done);
```

should fail if the address is invalid.

```js
var address = ADDRESSES[COIN].player.address.slice(0, ADDRESSES[COIN].player.address.length - 1);
var signature = ADDRESSES[COIN].player.signature;
request.post('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        address: address,
        signature: signature
    })
    .expect(406, new RegExp("Invalid " + COIN + " address"), done);
```

should fail if the address is a deposit address.

```js
var address = ADDRESSES[COIN].server.address;
var signature = ADDRESSES[COIN].server.signature;
request.post('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        address: address,
        signature: signature
    })
    .expect(406, /This is a Betcoin deposit address, don't do that/, done);
```

should fail if withdraw address is already in use.

```js
var address = ADDRESSES[COIN].player.address;
var signature = ADDRESSES[COIN].player.signature;
request.post('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        address: address,
        signature: signature
    })
    .end(function(err) {
        if (err) return done(err);
        var user2 = new User({
            username: getUsername(),
            email: 'test@betcoin.tm',
            password: 'password10',
            ip: '0.0.0.0',
            token: auth.generateToken(),
            challenge: 'foo'
        });
        user2.save(function(err) {
            if (err) return done(err);
            request.post('/wallet/' + user2.primary())
                .set('X-Currency', COIN)
                .set('Authorization', 'Bearer ' + user2.token())
                .send({
                    address: address,
                    signature: signature
                })
                .expect(409, /This withdraw address is already in use/, done);
        });
    });
```

should fail if the user already has a wallet for that currency.

```js
var address = ADDRESSES[COIN].player.address;
var signature = ADDRESSES[COIN].player.signature;
request.post('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        address: address,
        signature: signature
    })
    .end(function(err) {
        if (err) return done(err);
        request.post('/wallet/' + user.primary())
            .set('X-Currency', COIN)
            .set('Authorization', 'Bearer ' + user.token())
            .send({
                address: address,
                signature: signature
            })
            .expect(409, new RegExp("You already have a " + COIN + " wallet"), done);
    });
```

<a name="api-bitcoin-walletcontroller-get-walletuserid"></a>
#### GET /wallet/:userId
should get a user's wallet.

```js
var address = ADDRESSES[COIN].player.address;
var signature = ADDRESSES[COIN].player.signature;
request.post('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        address: address,
        signature: signature
    })
    .expect(201)
    .expect(function(res) {
        assert.ok(res.body.deposit);
        assert.equal(res.body.playerId, undefined);
        assert.equal(res.body.withdraw, address);
    })
    .end(function(err) {
        if (err) return done(err);
        request.get('/wallet/' + user.primary())
            .set('X-Currency', COIN)
            .set('Authorization', 'Bearer ' + user.token())
        // .expect(200)
            .expect(function(res) {
                assert.ok(res.body.deposit);
                assert.equal(res.body.playerId, undefined);
                assert.equal(res.body.withdraw, address);
            })
            .end(done);
    });
```

<a name="api-bitcoin-walletcontroller-put-walletuserid"></a>
#### PUT /wallet/:userId
<a name="api-bitcoin-walletcontroller-put-walletuserid-withdraw-address-update"></a>
##### withdraw address update
should update a withdraw address.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdraw: ADDRESSES[COIN].playerUpdate.address,
        signature: ADDRESSES[COIN].playerUpdate.signature,
        oldSignature: ADDRESSES[COIN].player.signature
    })
    .expect(202)
    .expect(function(res) {
        assert.equal(res.body.withdraw, ADDRESSES[COIN].playerUpdate.address);
    })
    .end(done);
```

should fail if missing old signature.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdraw: ADDRESSES[COIN].server.address,
        signature: ADDRESSES[COIN].server.signature,
    })
    .expect(400, /Missing previous signature/, done);
```

should reject a withdraw address update with a deposit address.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdraw: ADDRESSES[COIN].server.address,
        signature: ADDRESSES[COIN].server.signature,
        oldSignature: ADDRESSES[COIN].player.signature
    })
    .expect(406, /This is a Betcoin deposit address, don't do that/, done);
```

should reject a withdraw address update with an invalid address.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdraw: ADDRESSES[COIN].playerUpdate.address.slice(0, ADDRESSES[COIN].playerUpdate.address.length - 1),
        signature: ADDRESSES[COIN].playerUpdate.signature,
        oldSignature: ADDRESSES[COIN].player.signature
    })
    .expect(406, new RegExp("Invalid " + COIN + " address"), done);
```

<a name="api-bitcoin-walletcontroller-put-walletuserid-set-backup-address"></a>
##### set backup address
should set a backup withdraw address.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdrawBackup: ADDRESSES[COIN].playerBackup.address,
        signature: ADDRESSES[COIN].playerBackup.signature,
    })
    .expect(202)
    .expect(function(res) {
        assert.equal(res.body.withdrawBackup, ADDRESSES[COIN].playerBackup.address);
    })
    .end(done);
```

should reject a backup withdraw address with a deposit address.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdrawBackup: ADDRESSES[COIN].server.address,
        signature: ADDRESSES[COIN].server.signature,
    })
    .expect(406, /This is a Betcoin deposit address, don't do that/, done);
```

should reject a backup withdraw address with an invalid address.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdrawBackup: ADDRESSES[COIN].playerBackup.address.slice(0, ADDRESSES[COIN].playerBackup.address.length - 1),
        signature: ADDRESSES[COIN].playerBackup.signature,
    })
    .expect(406, new RegExp("Invalid " + COIN + " address"), done);
```

<a name="api-bitcoin-walletcontroller-put-walletuserid-update-backup-address"></a>
##### update backup address
should update a backup withdraw address.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdrawBackup: ADDRESSES[COIN].playerUpdate.address,
        signature: ADDRESSES[COIN].playerUpdate.signature,
        oldSignature: ADDRESSES[COIN].playerBackup.signature
    })
    .expect(202)
    .expect(function(res) {
        assert.equal(res.body.withdrawBackup, ADDRESSES[COIN].playerUpdate.address);
    })
    .end(done);
```

should fail if missing old signature.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdrawBackup: ADDRESSES[COIN].server.address,
        signature: ADDRESSES[COIN].server.signature,
    })
    .expect(400, /Missing previous signature/, done);
```

should reject a backup withdraw address update with a deposit address.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdrawBackup: ADDRESSES[COIN].server.address,
        signature: ADDRESSES[COIN].server.signature,
        oldSignature: ADDRESSES[COIN].playerBackup.signature
    })
    .expect(406, /This is a Betcoin deposit address, don't do that/, done);
```

should reject a backup withdraw address update with an invalid address.

```js
request.put('/wallet/' + user.primary())
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        withdraw: ADDRESSES[COIN].playerUpdate.address.slice(0, ADDRESSES[COIN].playerUpdate.address.length - 1),
        signature: ADDRESSES[COIN].playerUpdate.signature,
        oldSignature: ADDRESSES[COIN].playerBackup.signature
    })
    .expect(406, new RegExp("Invalid " + COIN + " address"), done);
```

<a name="api-circle"></a>
## circle
<a name="api-circle-get-circlenext"></a>
### GET /circle/next
should get the next game.

```js
request.get('/' + GAME + '/next')
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .query({game: 1})
    .expect(200)
    .expect(function(res) {
        assert.ok(/[a-f0-9]/.test(res.body.sha256));
        assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
        assert.equal(res.body.game, 1);
    })
    .end(done);
```

should reject a next game request without a game selected.

```js
request.get('/' + GAME + '/next')
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "missing game from next game request");
    })
    .end(done);
```

<a name="api-circle-post-circle"></a>
### POST /circle
should play a game.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        game: 1,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(200)
    .expect(function(res) {
        assert.ok(res.body.winnings !== undefined);
        assert.ok(res.body.payout_multiplier !== undefined);
    })
    .end(function(err, res) {
        if (err) return done(err);
        Wallet.get(wallet.primary(), function(err, _wallet) {
            if (err) return done(err);
            var newBalance = INITIAL_BALANCE - 1000 + res.body.winnings;
            if (newBalance !== _wallet.balance()) {
                var errString = format("Balance mismatch after gameplay %d !== %d", newBalance, _wallet.balance());
                return done(new Error(errString));
            }
            return done();
        });
    });
```

should reject an invalid gameId.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: '542cd48c5cb3ec0600000000',
        game: 1,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(404)
    .expect(function(res) {
        assert.equal(res.body.message, "game not found");
    })
    .end(done);
```

should reject a missing gameId.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        game: 1,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "missing game id from play request");
    })
    .end(done);
```

should reject a game that has been played already.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        game: 1,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(200)
    .end(function(err, res) {
        if (err) return done(err);
        assert.ok(res.body.winnings !== undefined);
        assert.ok(res.body.payout_multiplier !== undefined);
        request.post('/' + GAME)
            .set('X-Currency', COIN)
            .set('Authorization', 'Bearer ' + user.token())
            .send({
                gameId: nextGameId,
                game: 1,
                client_seed: getUsername(),
                wager: 1000
            })
            .expect(422)
            .expect(function(res) {
                assert.equal(res.body.message, "This game has already been played");
            })
            .end(done);
    });
```

should reject a missing wager.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        game: 1,
        client_seed: getUsername()
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "invalid wager in play request");
    })
    .end(done);
```

should reject a NaN wager.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        game: 1,
        client_seed: getUsername(),
        wager: 'foo'
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "invalid wager in play request");
    })
    .end(done);
```

should reject a missing client seed.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        game: 1,
        wager: 1000
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "missing client seed from play request");
    })
    .end(done);
```

<a name="api-circle-get-circleid"></a>
### GET /circle/:id
should get an unplayed game.

```js
request.get('/' + GAME + '/' + nextGameId)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .expect(200)
    .expect(function(res) {
        assert.ok(res.body.server_seed === undefined);
        assert.ok(/[a-f0-9]/.test(res.body.sha256));
        assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
    })
    .end(done);
```

should get a played game.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        game: 1,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(200)
    .expect(function(res) {
        assert.ok(res.body.winnings !== undefined);
        assert.ok(res.body.payout_multiplier !== undefined);
    })
    .end(function(err) {
        if (err) return done(err);
        request.get('/' + GAME + '/' + nextGameId)
            .set('X-Currency', COIN)
            .set('Authorization', 'Bearer ' + user.token())
            .expect(200)
            .expect(function(res) {
                assert.ok(res.body.server_seed !== undefined);
            })
            .end(done);
    });
```

<a name="api-circle-get-circleleaderboard"></a>
### GET /circle/leaderboard
should get a leaderboard.

```js
async.times(5, function(i, next) {
    var nextGameId;
    request.get('/' + GAME + '/next')
        .set('X-Currency', COIN)
        .set('Authorization', 'Bearer ' + user.token())
        .query({game: 1})
        .expect(200)
        .expect(function(res) {
            assert.ok(/[a-f0-9]/.test(res.body.sha256));
            assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
        })
        .end(function(err, res) {
            if (err) return done(err);
            nextGameId = res.body.nextGameId;
            request.post('/' + GAME)
                .set('X-Currency', COIN)
                .set('Authorization', 'Bearer ' + user.token())
                .send({
                    gameId: nextGameId,
                    game: 1,
                    client_seed: getUsername(),
                    wager: 1000
                })
                .expect(200)
                .expect(function(res) {
                    assert.ok(res.body.winnings !== undefined);
                    assert.ok(res.body.payout_multiplier !== undefined);
                })
                .end(function(err) {
                    return next(err);
                });
        });
}, function(err) {
    if (err) return done(err);
    request.get('/' + GAME + '/leaderboard')
        .set('X-Currency', COIN)
        .set('Authorization', 'Bearer ' + user.token())
        .expect(200)
        .expect(function(res) {
            assert.ok(Array.isArray(res.body));
            assert.equal(res.body[0]._id, user.username());
            assert.equal(res.body[0].wagered, 5000);
        })
        .end(done);
});
```

<a name="api-dice"></a>
## dice
<a name="api-dice-get-dicenext"></a>
### GET /dice/next
should get the next game.

```js
request.get('/' + GAME + '/next')
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .expect(200)
    .expect(function(res) {
        assert.ok(/[a-f0-9]/.test(res.body.sha256));
        assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
    })
    .end(done);
```

<a name="api-dice-post-dice"></a>
### POST /dice
should play a game.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(200)
    .expect(function(res) {
        assert.ok(res.body.winnings !== undefined);
        assert.ok(res.body.payout_multiplier !== undefined);
    })
    .end(function(err, res) {
        if (err) return done(err);
        Wallet.get(wallet.primary(), function(err, _wallet) {
            if (err) return done(err);
            var newBalance = INITIAL_BALANCE - 1000 + res.body.winnings;
            if (newBalance !== _wallet.balance()) {
                var errString = format("Balance mismatch after gameplay %d !== %d",
                                       newBalance,
                                       _wallet.balance());
                return done(new Error(errString));
            }
            return done();
        });
    });
```

should reject an invalid gameId.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: '542cd48c5cb3ec0600000000',
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(404)
    .expect(function(res) {
        assert.equal(res.body.message, "game not found");
    })
    .end(done);
```

should reject a missing gameId.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "missing game id from play request");
    })
    .end(done);
```

should reject a game that has been played already.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(200)
    .end(function(err, res) {
        if (err) return done(err);
        assert.ok(res.body.winnings !== undefined);
        assert.ok(res.body.payout_multiplier !== undefined);
        request.post('/' + GAME)
            .set('X-Currency', COIN)
            .set('Authorization', 'Bearer ' + user.token())
            .send({
                gameId: nextGameId,
                gameTarget: 32650,
                client_seed: getUsername(),
                wager: 1000
            })
            .expect(422)
            .expect(function(res) {
                assert.equal(res.body.message, "This game has already been played");
            })
            .end(done);
    });
```

should reject a missing wager.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        client_seed: getUsername()
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "invalid wager in play request");
    })
    .end(done);
```

should reject a NaN wager.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 'foo'
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "invalid wager in play request");
    })
    .end(done);
```

should reject a missing client seed.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        wager: 1000
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "missing client seed from play request");
    })
    .end(done);
```

<a name="api-dice-get-diceid"></a>
### GET /dice/:id
should get an unplayed game.

```js
request.get('/' + GAME + '/' + nextGameId)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .expect(200)
    .expect(function(res) {
        assert.ok(res.body.server_seed === undefined);
        assert.ok(/[a-f0-9]/.test(res.body.sha256));
        assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
    })
    .end(done);
```

should get a played game.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(200)
    .expect(function(res) {
        assert.ok(res.body.winnings !== undefined);
        assert.ok(res.body.payout_multiplier !== undefined);
    })
    .end(function(err) {
        if (err) return done(err);
        request.get('/' + GAME + '/' + nextGameId)
            .set('X-Currency', COIN)
            .set('Authorization', 'Bearer ' + user.token())
            .expect(200)
            .expect(function(res) {
                assert.ok(res.body.server_seed !== undefined);
            })
            .end(done);
    });
```

<a name="api-dice-get-diceleaderboard"></a>
### GET /dice/leaderboard
should get a leaderboard.

```js
async.times(5, function(i, next) {
    var nextGameId;
    request.get('/' + GAME + '/next')
        .set('X-Currency', COIN)
        .set('Authorization', 'Bearer ' + user.token())
        .expect(200)
        .expect(function(res) {
            assert.ok(/[a-f0-9]/.test(res.body.sha256));
            assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
        })
        .end(function(err, res) {
            if (err) return done(err);
            nextGameId = res.body.nextGameId;
            request.post('/' + GAME)
                .set('X-Currency', COIN)
                .set('Authorization', 'Bearer ' + user.token())
                .send({
                    gameId: nextGameId,
                    gameTarget: 32650,
                    client_seed: getUsername(),
                    wager: 1000
                })
                .expect(200)
                .expect(function(res) {
                    assert.ok(res.body.winnings !== undefined);
                    assert.ok(res.body.payout_multiplier !== undefined);
                })
                .end(function(err) {
                    return next(err);
                });
        });
}, function(err) {
    if (err) return done(err);
    request.get('/' + GAME + '/leaderboard')
        .set('X-Currency', COIN)
        .set('Authorization', 'Bearer ' + user.token())
        .expect(200)
        .expect(function(res) {
            assert.ok(Array.isArray(res.body));
            assert.equal(res.body[0]._id, user.username());
            assert.equal(res.body[0].wagered, 5000);
        })
        .end(done);
});
```

<a name="api-blackjack"></a>
## blackjack
<a name="api-blackjack-get-blackjacknext"></a>
### GET /blackjack/next
should get the next game.

```js
request.get('/' + GAME + '/next')
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .expect(200)
    .expect(function(res) {
        assert.ok(/[a-f0-9]/.test(res.body.sha256));
        assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
    })
    .end(done);
```

<a name="api-blackjack-post-blackjack"></a>
### POST /blackjack
should play a game.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(200)
    .expect(function(res) {
        assert.ok(res.body.player_hands);
        assert.ok(res.body.dealer_hand);
    })
    .end(function(err, res) {
        if (err) return done(err);
        Wallet.get(wallet.primary(), function(err, _wallet) {
            if (err) return done(err);
            var newBalance = INITIAL_BALANCE - 1000 + res.body.winnings;
            if (newBalance !== _wallet.balance()) {
                var errString = format("Balance mismatch after gameplay %d !== %d",
                                       newBalance,
                                       _wallet.balance());
                return done(new Error(errString));
            }
            return done();
        });
    });
```

should reject an invalid gameId.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: '542cd48c5cb3ec0600000000',
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(404)
    .expect(function(res) {
        assert.equal(res.body.message, "game not found");
    })
    .end(done);
```

should reject a missing gameId.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "missing game id from play request");
    })
    .end(done);
```

should reject a game that has been played already.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 1000
    })
    .expect(200)
    .end(function(err, res) {
        if (err) return done(err);
        assert.ok(res.body.player_hands);
        assert.ok(res.body.dealer_hand);
        request.post('/' + GAME)
            .set('X-Currency', COIN)
            .set('Authorization', 'Bearer ' + user.token())
            .send({
                gameId: nextGameId,
                gameTarget: 32650,
                client_seed: getUsername(),
                wager: 1000
            })
            .expect(422)
            .expect(function(res) {
                assert.equal(res.body.message, "This game has already been played");
            })
            .end(done);
    });
```

should reject a missing wager.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        client_seed: getUsername()
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "invalid wager in play request");
    })
    .end(done);
```

should reject a NaN wager.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        client_seed: getUsername(),
        wager: 'foo'
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "invalid wager in play request");
    })
    .end(done);
```

should reject a missing client seed.

```js
request.post('/' + GAME)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .send({
        gameId: nextGameId,
        gameTarget: 32650,
        wager: 1000
    })
    .expect(400)
    .expect(function(res) {
        assert.equal(res.body.message, "missing client seed from play request");
    })
    .end(done);
```

<a name="api-blackjack-get-blackjackid"></a>
### GET /blackjack/:id
should get an unplayed game.

```js
request.get('/' + GAME + '/' + nextGameId)
    .set('X-Currency', COIN)
    .set('Authorization', 'Bearer ' + user.token())
    .expect(200)
    .expect(function(res) {
        assert.ok(res.body.server_seed === undefined);
        assert.ok(/[a-f0-9]/.test(res.body.sha256));
        assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
    })
    .end(done);
```

should get a played game.

```js
getCompletedGame(COIN, function(err, res) {
    if (err) return done(err);
    request.get('/' + GAME + '/' + res.body._id)
        .set('X-Currency', COIN)
        .set('Authorization', 'Bearer ' + user.token())
        .expect(200)
        .expect(function(res) {
            assert.ok(Array.isArray(res.body.final_array));
            assert.ok(Array.isArray(res.body.remainingcards));
        })
        .end(done);
});
```

<a name="api-blackjack-get-blackjackleaderboard"></a>
### GET /blackjack/leaderboard
should get a leaderboard.

```js
async.times(5, function(i, next) {
    var nextGameId;
    request.get('/' + GAME + '/next')
        .set('X-Currency', COIN)
        .set('Authorization', 'Bearer ' + user.token())
        .expect(200)
        .expect(function(res) {
            assert.ok(/[a-f0-9]/.test(res.body.sha256));
            assert.ok(/[a-f0-9]/.test(res.body.nextGameId));
        })
        .end(function(err, res) {
            if (err) return done(err);
            nextGameId = res.body.nextGameId;
            request.post('/' + GAME)
                .set('X-Currency', COIN)
                .set('Authorization', 'Bearer ' + user.token())
                .send({
                    gameId: nextGameId,
                    gameTarget: 32650,
                    client_seed: getUsername(),
                    wager: 1000
                })
                .expect(200)
                .end(function(err) {
                    return next(err);
                });
        });
}, function(err) {
    if (err) return done(err);
    request.get('/' + GAME + '/leaderboard')
        .set('X-Currency', COIN)
        .set('Authorization', 'Bearer ' + user.token())
        .expect(200)
        .expect(function(res) {
            assert.ok(Array.isArray(res.body));
            assert.ok(res.body.length);
            assert.equal(res.body[0]._id, user.username());
            assert.equal(res.body[0].wagered, 5000);
        })
        .end(done);
});
```


[32mDone, without errors.[39m
