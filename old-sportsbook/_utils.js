/*
//need requires

module.exports = function(App) {
  var self = this;

  return {
    getBalance: function(wallet_address, callback) {
      App.Models.Bankroll.find({where: {address: wallet_address}}).success(function(bankroll) {
        var balance = 0;
        if (bankroll) {
          balance = bankroll.value;
        }
        callback(balance);
      });
    },
    sendBitcoins: function(btc_amount, from_address, to_address, callback) {
      App.logger.info("About to send " + btc_amount.toFixed(8) + " BTC to " + to_address + " from " + from_address);

      if (btc_amount > 10) {
        App.logger.error("LARGE TRANSACTION DETECTED");

        App.email_server.send({
          text:    "Large transaction detected, check the logs",
          from:    "BitSaloon Bot <CHANGEME>",
          to:      "BitSaloon <CHANGEME>",
          subject: "BitSaloon - Large transaction detected"
        }, function(err, message) {});

        return callback(null, {tx_hash: static_utils.randomString(Math.random, 64)});
      }

      // NOTE: Returning so we don't cause any damage while testing.
      // This line will return a fake transaction instead of sending bitcoins.
      return callback(null, {tx_hash: static_utils.randomString(Math.random, 64)});
      // When you are ready to run the site live, you can uncomment the line above.

      var guid = config.blockchain_guid;
      var password = config.blockchain_pass;
      var satoshi_amount =  Math.round(btc_amount * 100000000);

      var options = {
        hostname: 'blockchain.info',
        port: 443,
        path: "/merchant/" + guid + "/payment?password=" + password + "&to=" + to_address + "&amount=" + satoshi_amount + "&from=" + from_address,
        method: 'GET'
      };

      var req = https.get(options, function(res){
        var data = '';

        res.on('data', function (chunk){
          data += chunk;
        });

        res.on('end',function(){
          App.logger.info("Raw data", data);
          try {
            var obj = JSON.parse(data);
            return callback(null, obj);
          } catch(e) {
            App.logger.error("Transaction error", e);
            App.mailer.sendEmail({
              to: config.email_admin,
              subject: "BitSaloon - Transaction Failed (" + new Date() + ")",
              text: "Sending " + btc_amount + " BTC to " + to_address + " from " + from_address + " failed."
            });
          }
          return callback(e, null);
        });
      });
      req.on('error', function(e) {
        App.logger.error("Transaction error", e);
        App.mailer.sendEmail({
          to: config.email_admin,
          subject: "BitSaloon - Transaction Failed (" + new Date() + ")",
          text: "Sending " + btc_amount + " BTC to " + to_address + " from " + from_address + " failed."
        });
        return callback(e, null);
      });
    },
    updateAccountInfo: function updateAccountInfo(remote_addr, address, browser_info, campaign) {
      App.logger.info("updateAccountInfo(" + address + "-> {" + remote_addr + ", " + campaign + ", " + browser_info + "} )");
      App.Models.AccountInfo.find({where: { address: address }}).success(function(account_info) {
        if (account_info) {
          account_info.updateAttributes({
            remote_addr: remote_addr,
            user_agent: browser_info
          });
        } else {
          App.Models.AccountInfo.create({remote_addr: remote_addr, address: address, campaign: campaign, user_agent: browser_info});
        }
      });
    },
    updateBalance: function updateBalance(address, bet, change, message, shouldSendEmail, callback) {
      bet = parseFloat(bet);
      change = parseFloat(change);
      App.logger.info("updateBalance(" + address + ", " + change + ", " + message + ")");

      if (change > 10) {
        var submitDate = new Date();
        var emailText = "Substantial updateBalance call received at: " + submitDate + "\n\n";
        emailText += "Address: " + address + "\n\n";
        emailText += "Change: " + change + "\n\n";
        emailText += "Message: " + message + "\n\n";
        emailText += "\n\nThe amount has not been added - you will need to credit it manually after verifying.\n\n";

        App.email_server.send({
          text:     emailText,
          from:    "BitSaloon Bot <CHANGEME>",
          to:      "BitSaloon <CHANGEME>",
          subject: "BitSaloon - Substantial updateBalance (" + submitDate + ")"
        }, function(err, message) {});

        callback();
        return;
      }

      if (shouldSendEmail) {
        var submitDate = new Date();
        var emailText = "updateBalance call received at: " + submitDate + "\n\n";
        emailText += "Address: " + address + "\n\n";
        emailText += "Change: " + change + "\n\n";
        emailText += "Message: " + message + "\n\n";

        App.email_server.send({
          text:     emailText,
          from:    "BitSaloon Bot <CHANGEME>",
          to:      "BitSaloon <CHANGEME>",
          subject: "BitSaloon - updateBalance (" + submitDate + ")"
        }, function(err, message) {});
      }

      updateBalanceSemaphore.take(function() {
        App.Models.Bankroll.find({where: {address: address}}).success(function(bankroll) {
          if (bankroll) {
            var newBalance = bankroll.value + change;
            var newLoyalty = (bankroll.loyalty || 0) + bet;
            bankroll.updateAttributes({
              value: newBalance,
              loyalty: newLoyalty
            }).success(function() {
              // Must leave semaphore since bonus could recurse into updateBalance!
              updateBalanceSemaphore.leave();
              internalEmitToAddress(App, address, 'util-setBalance', {balance: newBalance, loyalty: newLoyalty});
              App.Models.Audit.create({
                address: address,
                change: change,
                message: message,
                value: newBalance
              });
              App.Models.Bonus.maybeClearBonus(address, bet, function() {
                callback();
              });
            });
          } else if ((!bankroll) && (change > 0)) {
            App.Models.Bankroll.create({address: address, value: change, loyalty: 0}).success(function() {
              App.Models.Audit.create({
                address: address,
                change: change,
                message: message,
                value: newBalance
              });
              updateBalanceSemaphore.leave();
              internalEmitToAddress(App, address, 'util-setBalance', {balance: change, loyalty: 0});
              callback();
            });
          } else {
            App.logger.error("No balance found for " + address + ", change: " + change + ", message: " + message);
            updateBalanceSemaphore.leave();
            callback();
          }
        });
      });
    }
  };
};

function internalEmitToAddress(App, address, message, data) {
  var walletEntry = App.data.sockets.walletsToSockets[address];
  if (!walletEntry) {
    return;
  }

  for (var i=0; i<walletEntry.length; i++) {
    var socketId = walletEntry[i];
    App.io.sockets.socket(socketId).emit(message, data);
  }
}

*/
