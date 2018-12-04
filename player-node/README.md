# Player Server #

Inital version, untested. This has so far been done only in concept
and importing parts of the old player server where
needed/applicable. This message will be removed when it is ready for
development use.

## Dev Settings ##

If `app.env === "development"` (default when running express) then the
App-Key check is bypassed for adding user transactions

There is a dev version of this running at 54.194.152.52 on port 441
with ssl enabled. To make the certificate check out properly add
`54.194.152.52 player.betcoin.tm` to your /etc/hosts file and access
it via this alias (NOTE: this only works on linux/osx systems, if you
are on windows you are on your own).

The dev server uses testnet coins rather than real BTC. Contact
Atticus to get some sent to you for dev purposes.

## Unit Tests ##
To run the unit tests

    grunt

There is also a shortcut to trigger unit tests automatically 
every time a source file has been changed.

    grunt test-monitor

At the moment, bitcoin in the code are mocked for the existing tests.
Mongodb should be mocked as well, but now it is running against a real mongodb. 
For now, in order to pass the unit tests, it will need to set the Mongodb connection string as a environment variable. 
The Mongodb mock will be implemented soon.

## Public Endpoints ##

### `POST /user` ###

Sign up a user

POST params

- password: The selected password
- alias: (Optional) The user's slected alias, will be generated randomly if missing
- email: (Optional if creatwWallet is false) email address
- createWallet: (Boolean) Create a new account on blockchain.info and return the info along with the user data
- withdrawAddress: (Optional) A withdraw address to assign to the user at creation time, overridden if createWallet is true

Response

JSON encoded user object

This will contain the key `newWallet` if `createWallet` is used. This
will have the user's new wallet login details. YOU WILL NOT GET THIS
INFO AGAIN (but that's probably OK since the user will get an email
from blockchain.info on how to log in)

### `GET /auth` ###

Get API-Token

Use basic auth for username and password

    Authorization: Basic <base64 encoded user:pass>

You can also use this endpoint to refresh a token (for example,
calling the `/auth` endpoint on page load with the
[angular-bc-player](https://git.betcoin.tm/frontend/angular-bc-player)
module using a cookie stored token). In this case pass up the token as
you would with the protected endpoints below. This will return a *new*
API-Token.

Response

- JSON encoded user object
- API-Token header set to user's API token

## User Endpoints ##

All of these endpoints require the `Authorization` header to be set to
`Bearer: $API_TOKEN` using the token retrieved from `/auth`

Any endpoint requiring `:userId` will only allow the user to update
their *own* record. The id of the user obtained from the API token
check is used to compare.

The url paramete `:currency` is the currency to use for certain
actions. Right now only `'btc'` is recognized (and *is* required)

### `GET /user/:userId` ###

Get the user's info

Response

- JSON encoded user object

### `PUT /user/:userId` ###

Update a user's alias, password or email

PUT params

- alias: A new alias
- email: A new email
- password: A new password

Response

- JSON encoded user object

### `GET /user/:userId/challenge` ###

Get a challenge string for signing with a bitcoin private key

Response

    {
        challenge: "challenge string to sign"
    }

### `GET /user/:userId/widthdraw/:currency` ###

Initiate a user withdraw

Response

- JSON encoded user object

### `PUT /user/:userId/address/withdraw/:currency` ###

Add a withdraw address

PUT params

- address: The address to add
- originalSig: The challenge string signed by the users original
  address (not required if this is the first address being added)
- sig: The challenge string signed by the address being added

Response

    {
        "address": "the new address added"
    }

## Internal Endpoints ##


All of these endpoints require a header `App-Key` to be set. This app
key is compared using bcrypt to the hash of the key stored in
`config/app-keys.json` as an object with app names for keys (see
below) and key hashes for values. Use the
[generator script] (bin/app-keygen) to generate a key/hash pair.

The `:app` url param is the name of the app as it appears in the
`config/app-keys.json` file.

### `POST /transaction/:app/:creditDebit/:userId` ###

URL params

- creditDebit: either `'credit'` or `'debit'`, indicating the action to be taken
- userId: the userId to make the transaction for

POST params

- amtIn: (Required for credit only) The amount to credit the account
  (Integer only!)
- amtOut: (Required for debit only) The amount to debit the account
  (Integer only!)
- type: The type of transaction (this is up to the app, there may be a
  type registartion mechanism in the future)
- refId: The id of the thing that is causing this transaction (in the
  context of a game server talking to this server, it would likely be
  the gameId of the game that warrented this transaction)
- meta: A Javascript (JSON) object containing any other info that
  should be attached to this transaction, but does not fit one of the
  above params. This should be only 1 level deep (think of it as a
  simple key/value store)


## API endpoints documentation ##

The API is integrated with Swagger documentation tool to describe the details of
 each of the API endpoints.

The swagger dynamically generate the documentations from the swagger API schema.
It also provides the input forms with each parameter fields of each API enpoints 
accepts, so it is helpful to play around with the API before coding the front end 
to interact with the API.

To generate the documentations from swagger, run `node app.js`, go to 
`node_modules/swagger-node-express/swagger-ui`, and open index.html using browser, 
put in the API schema url `http://localhost:8443/api-docs`.


#### Later ####

There is also a [swagger to markdown converter lib] (https://github.com/Skookum/SwaggerToMarkdown), that we could use to quickly turn the existing swagger documentations into markdown texts for other forms of documentations, such as walkthrough/tutorial.
