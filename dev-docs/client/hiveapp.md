# Hive Wallet Apps #

## Building ##

To build a hiveapp, (assuming the project supports it) use the
environment variable `HIVEAPP` when building. If you are distributing,
also be sure to use `NODE_ENV=production` to compile out any
development markup.

```sh
cd dice-ng
HIVEAPP=1 NODE_ENV=production grunt
```

This will create a build of the hiveapp in the `build/en_US/dice`
folder, as well as a zip file at `tm.betcoin.dice`. This zip file can
be extraced ofer the hiveapp repo for deployment.

## Testing ##

You can use the `server.js` applet as described in
[the main client README](https://bitbucket.org/betcn/dev-docs/src/master/client/README.md)
to test the hive app builds by using the following options

```sh
cd betcoin-ng
node server --as-root --prod dice
```

The `--as-root` option uses the `--prod` folder as the root folder for
the web server (the `-ng` suffix is automatically added)

You can specify the `--port` option as well if you are already running
the global server on port 3002 and want to have multiple servers
running
