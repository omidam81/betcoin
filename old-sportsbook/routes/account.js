// need to add dependencies
var async = require('async');
var passport = require('passport');
var semaphore = require('semaphore');
var static_utils = require('../lib/utils');
var withdrawalSemaphore = semaphore(1);
var config = require('../config.json');

module.exports = function(App) {
  return {
    index: function(req, res, next) {
      var transfers = [];
      var address = req.session.wallet_address;

      if (address) {
        App.Models.Transfer.findAll({where: {address: address}, order: "createdAt desc"}).success(function(transfers) {
          App.Models.Audit.findAll({where: {address: address}, order: "createdAt desc", limit: 20}).success(function(audits) {
            App.Models.Bonus.findAll({where: {address: address}}).success(function(bonuses) {
              renderAccount(res, address, transfers, audits, bonuses);
              return;
            });
          });
          return;
        });
        return;
      }

      App.bitcoin_client.cmd('getnewaddress', function(err, address) {
        if (err) {
          App.logger.error("Error getting new wallet address", err);
          address = "ERROR";
        } else {
          req.session.wallet_address = address;
          renderAccount(res, address, [], [], []);
          return;
        }
      });
    },
    sports: function(req, res, next) {
      var address = req.session.wallet_address;
      SportsBet.findAll({where: ["address = ? AND status = ?", address, 'open'], order: 'updatedAt desc', include: [SportsBetOdd, SportsEvent]}).success(function(openSportsBets) {
        SportsBet.findAll({where: ["address = ? AND status != ?", address, 'open'], order: 'updatedAt desc', include: [SportsBetOdd, SportsEvent]}).success(function(resolvedSportsBets) {
          sportsBets = openSportsBets.concat(resolvedSportsBets);
          var i = 0;
          async.each(sportsBets, function(sportsBet, callback) {
            var sportsEvent = sportsBet.sportsEvent;
            SportsLeague.find(sportsEvent.league_id).success(function(sportsLeague) {
              sportsEvent.sportsLeague = sportsLeague;
              sportsEvent.getSportsEventParticipants().success(function(eventParticipants) {
                sportsEvent.sportsEventParticipants = eventParticipants;
                async.each(eventParticipants, function(eventParticipant, inner_callback) {
                  eventParticipant.getSportsParticipant().success(function(sportsParticipant) {
                    eventParticipant.sportsParticipant = sportsParticipant;
                    inner_callback();
                  });
                }, function(err) {
                  callback();
                });
              });
            });
        }, function(err) {
          res.render('account/sports', {openSportsBets: openSportsBets, resolvedSportsBets: resolvedSportsBets});
          });
        });
      });
    },
    withdraw: function(req, res, next) {
      var wallet_address = req.session.wallet_address;
      var output_address = req.body.address;
      var output_amount = parseFloat(req.body.amount);

      // BitSaloon House account
      var input_addr = config.blockchain_addr;

      if (!App.utils.validAddress(output_address)) {
        App.utils.emitToAddress(wallet_address, 'appError', {message: "Invalid withdrawal address"});
        return res.end();
      }

      if (isNaN(output_amount) || (output_amount < 0.0005) || (output_amount > 10)) {
        App.utils.alertCheatingRequest("Withdrawal output amount: " + output_amount, req);
        App.utils.emitToAddress(wallet_address, 'appError', {message: "Invalid withdrawal amount"});
        return res.end();
      }

      withdrawalSemaphore.take(function() {
        App.utils.getBalance(wallet_address, function(balance) {
          var availableBalance = balance - 0.0005;
          if (output_amount > availableBalance) {
            App.utils.emitToAddress(wallet_address, 'appError', {message: "Invalid withdrawal amount"});
            withdrawalSemaphore.leave();
            return res.end();
          }

          var message = "Withdrawal of " + output_amount + " to " + output_address;
          App.utils.updateBalance(wallet_address, 0, (-1*(output_amount + 0.0005)), message, true, function() {
            App.utils.sendBitcoins(output_amount, input_addr, output_address, function(err, tx_object) {
              if (err) {
                App.logger.error("Unable to send bitcoins: " + err.toString());
                App.utils.emitToAddress(wallet_address, 'appError', {message: "An error occurred: " + err.toString()});
                withdrawalSemaphore.leave();
                return res.end();
              }

              var hash = tx_object.tx_hash;
              App.Models.Transfer.create({direction: "withdrawal", tx_hash: hash, address: wallet_address, from_addr: input_addr, to_addr: output_address, value: (-1 * output_amount)}).success(function(new_transfer) {
                withdrawalSemaphore.leave();
                return res.end();
              });
            });
          });
        });
      });
    },
    ////////////////////
    // User functions //
    ////////////////////
    create: function(req, res) {
      var email = req.body.email;
      var salt = static_utils.randomString(Math.random, 64);
      var password = static_utils.hexSha256(salt + req.body.password);
      var address = req.session.wallet_address;


      User.find({where: {email: email}}).success(function(user) {
        if (user) {
          req.flash("Info", "That email address is already registered, please sign in.");
          return res.redirect('/account/login');
        }

        User.create({
          email: email,
          password: password,
          salt: salt,
          address: address,
          can_email: true
        }).success(function(user) {
          req.login(user, function(err) {
            return res.redirect('/');
          });
        });
      });
    },
    update: function(req, res) {
      if (!req.user) {
        return res.redirect('/account');
      }

      var canEmail = !!req.body.canEmail;
      req.user.updateAttributes({
        can_email: canEmail
      }).success(function() {
        return res.redirect('/account');
      });
    },
    login: function(req, res) {
      return res.render('account/login');
    },
    loginX: function(req, res, next) {
      passport.authenticate('local', function(err, user, info) {
        if (err || !user) {
          req.flash("Info", "Invalid login credentials");
          return res.redirect('/account/login');
        }
        req.session.wallet_address = user.address;
        req.login(user, function(err) {
          return res.redirect('/');
        });
      })(req, res, next);
    },
    logout: function(req, res){
      req.logout();
      req.session.wallet_address = null;
      req.session.destroy(function() {});
      res.data = {url: '/'};
      res.redirect('/');
    },
    otp: function(req, res) {
      var value = req.params.value;
      App.Models.OneTimePassword.find({where: {value: value, used_at: null}}).success(function(oneTimePassword) {
        if (!oneTimePassword) {
          return res.redirect('/');
        }

        oneTimePassword.updateAttributes({
          used_at: new Date()
        }).success(function() {
          var address = oneTimePassword.address;
          req.session.wallet_address = address;
          return res.redirect('/');
        });
      });
    }
  }
}

function renderAccount(res, wallet_address, transfers, audits, bonuses) {
  return res.render('account', {
    wallet_address: wallet_address,
    transfers: transfers,
    audits: audits,
    bonuses: bonuses
  });
}

