'use strict';

var qr = require('qr-image');


module.exports = function(app, logger, Config,
                          currencyMiddleware,
                          adminRoutes,
                          backofficeRoutes,
                          userRoutes,
                          walletRoutes,
                          bonusRoutes,
                          ticketRoutes,
                          notificationRoutes,
                          autobetRoutes,
                          HTTPError,
                          getExchangeRate,
                          auth,
                          UserController,
                          CounterController,
                          JackpotController,
                          WalletController,
                          StatsController) {

    app.use('/admin', adminRoutes);
    app.use('/backoffice', backofficeRoutes);

    var userController = new UserController();
    var counterController = new CounterController();
    var jackpotController = new JackpotController();
    var statsController = new StatsController();
    // qr functions
    app.get('/qrcode/address/:currency/:address', function(req, res) {
        var code = qr.image(req.params.currency + ':' + req.params.address.toString(), {size: 5});
        code.pipe(res);
    });
    app.get('/qrcode/google-two-factor/:secret', function(req, res) {
        var code = qr.image('otpauth://totp/betcoin.tm?secret=' + req.params.secret.toString(), {size: 5});
        code.pipe(res);
    });

    // all requests must have the `X-Currency` header set to
    // /(bit|lite|doge)coin/
    app.use(currencyMiddleware);
    // set the locale
    app.use(function(req, res, next) {
        req.locale = req.get('x-lang') || 'en_US';
        req.fiat = req.get('x-fiat') || (req.locale === 'en_US') ? 'USD' : 'CNY';
        next();
    });

    // verification functions for signing up
    app.get('/verify/username/:username', function(req, res, next) {
        userController.checkUsername(req.params.username, function(err, user, wallet) {
            if (err) return next(err);
            if (user) {
                if (user.anonymous()) {
                    req.body = {
                        address: wallet.withdrawAddress(),
                        anonymous: true,
                        currency: wallet.currency()
                    };
                    return userController.createAnonymous(req, res, next);
                } else {
                    return next(new HTTPError(409, "Username exists"));
                }
            } else {
                return res.send();
            }
        });
    });
    app.get('/verify/withdraw/:address', function(req, res, next) {
        new WalletController(req.currency).checkAddress(req.params.address, function(err) {
            if (err) return next(err);
            return res.send();
        });
    });
    app.get('/exchange-rate', function(req, res) {
        return res.json(getExchangeRate());
    });
    app.get('/counter', counterController.read.bind(counterController));
    app.get('/jackpots', jackpotController.read.bind(jackpotController));
    app.get('/stats', statsController.read.bind(statsController));

    app.use('/user', userRoutes);
    app.use('/ticket', ticketRoutes);
    // routes after this point are all authenticated
    app.use('/wallet', auth.checkToken, walletRoutes);
    app.use('/bonus', auth.checkToken, bonusRoutes);
    app.use('/notification', auth.checkToken, notificationRoutes);
    app.use('/autobet', auth.checkToken, autobetRoutes);

    // test to see if the user is accessing a route for a game that
    // has been put into maintenance mode
    app.use(function(req, res, next) {
        Config.get('maintenanceApps', function(err, maintenanceApps) {
            if (err) {
                logger.error("error getting maintenance mode apps");
                return next();
            }
            maintenanceApps.forEach(function(app) {
                var regexp = new RegExp('^/' + app);
                if (regexp.test(req.path)) {
                    err = next(new HTTPError(503, "We’re sorry this game is under maintenance, please try again later. In the meanwhile you can play other games."));
                }
            });
            return next(err);
        });
    });
};
