'use strict';

var fs = require('fs');
var readline = require('readline');
var assert = require('assert');
var container = require('../container');
var events = require('events');

// container.register('userModelStore', function(mongo) {
//     var store = mongo.getModella({dbname: 'userdb_migrate'});
//     store.ensureObjectId = mongo.ensureObjectId;
//     return store;
// });
// container.register('gameModelStore', function(mongo) {
//     var store = mongo.getModella({dbname: 'gamedb_migrate'});
//     store.objectId = mongo.objectId;
//     return store;
// });

var mongo = container.get('mongo');
// var userdb = mongo.getDb({dbname: 'userdb_migrate'});
var userdb = mongo.getDb({dbname: 'userdb'});
var User = container.get('User');
var Notification = container.get('Notification');
var Wallet = container.get('Wallet');
var AffiliateRecord = container.get('AffiliateRecord');
var CURRENCIES = container.get('CURRENCIES');
var Transaction = container.get('Transaction');
var User = container.get('User');

var txFilename = process.argv.pop();
var userFilename = process.argv.pop();

// fs.open(filename, 'r', function(err, fd) {
//     if (err) throw err;
//     var buf = new Buffer(10);
//     fs.read(fd, buf, 0, 10, null, function(err, bytesRead, buffer) {
//         if (err) throw err;
//         console.log("read %d bytes", bytesRead);
//         console.log("buffer %s", buffer);
//     });
// });


var lines = 0;
var userCol = userdb.collection('user');
var noteCol = userdb.collection('notification');
var walletCol = userdb.collection('wallet');
var txCol = userdb.collection('transaction');
var affRecCol = userdb.collection('affiliate_record');

userCol.remove({}, function(err) {
    if (err) throw err;
    noteCol.remove({}, function(err) {
        if (err) throw err;
        walletCol.remove({}, function(err) {
            if (err) throw err;
            txCol.remove({}, function(err) {
                if (err) throw err;
                affRecCol.remove({}, function(err) {
                    if (err) throw err;
                    var fileStream = fs.createReadStream(userFilename);
                    var txFileStream = fs.createReadStream(txFilename);
                    var lineBuffer, txLineBuffer;
                    var reader = readline.createInterface({
                        input: fileStream,
                        output: lineBuffer,
                        terminal: false
                    });
                    fileStream.on('close', function() {
                        reader.close();
                        console.log("%d lines processed", lines);
                        console.log("saves", saves);
                        fileclosed = true;
                    });
                    reader.on('line', function(line) {
                        lines += 1;
                        processUser(JSON.parse(line));
                    });
                    var txreader = readline.createInterface({
                        input: txFileStream,
                        output: txLineBuffer,
                        terminal: false
                    });
                    txFileStream.on('close', function() {
                        reader.close();
                        console.log("%d lines processed", lines);
                        console.log("saves", saves);
                        txfileclosed = true;
                    });
                    txreader.on('line', function(line) {
                        lines += 1;
                        processTx(JSON.parse(line));
                    });
                });
            });
        });
    });
});

var fileclosed = false;
var txfileclosed = false;

var saveTracker = new events.EventEmitter();

var saves = {};

var AFFS_POPULATED = false;
var doneFunc = function() {
    if (!AFFS_POPULATED) {
        return populateAffiliates();
    }
    console.log('-------------');
    console.log("finished");
    console.log("saves", saves);

    process.exit();
};

var timer = setTimeout(doneFunc, 10000);
saveTracker.on('saved', function(type) {
    clearTimeout(timer);
    if (saves[type]) saves[type] += 1;
    else saves[type] = 1;
    var modulo = 300;
    if (saves[type] % modulo === 0) {
        console.log("%d %ss saved", saves[type], type);
    }
    timer = setTimeout(doneFunc, 5000);
});

var processAffiliate = function(oldUser) {
    if (!oldUser.affiliate) return;
    CURRENCIES.forEach(function(currency) {
        var affRec = new AffiliateRecord({
            affiliateId: oldUser.affiliate,
            associateId: oldUser._id,
            currency: currency
        });
        affRecCol.insert(affRec.attrs, function(err) {
            if (err) throw err;
            saveTracker.emit("saved", "affiliate record");
        });
    });
};

var populateAffiliates = function() {
    AFFS_POPULATED = true;
    if (!affTxs.length) {
        console.log("no affiliate credits!!");
        doneFunc();
    }
    console.log("found %s affiliate credits", affTxs.length);
    affTxs.forEach(function(tx) {
        affRecCol.update({
            affiliateId: tx.userId(),
            currency: tx.currency()
        }, {
            $inc: { total: tx.credit() },
            $set: { updatedAt: tx.createdAt() }
        }, function(err) {
            if (err) throw err;
            saveTracker.emit("saved", "affiliate credit");
        });
    });
};

var processUser = function(oldUser) {
    if (!oldUser.created) {
        if (oldUser.updated) {
            oldUser.created = oldUser.updated;
        } else {
            oldUser.created = {$date: new Date().getTime()};
        }
    }
    if (!oldUser.updated) {
        oldUser.updated = {$date: new Date().getTime()};
    }
    var notifications = oldUser.notifications;
    processNotifications(oldUser._id.$oid, notifications);
    oldUser.notifications = undefined;
    Object.keys(oldUser).forEach(function(key) {
        if (oldUser[key] && 'object' === typeof oldUser[key]) {
            if (oldUser[key].$oid) {
                oldUser[key] = oldUser[key].$oid;
            } else if (oldUser[key].$date) {
                oldUser[key] = new Date(oldUser[key].$date);
            }
        }
    });
    delete oldUser.challenge;
    oldUser.username = oldUser.alias;
    oldUser.loginCount = oldUser.signinNum;
    oldUser.createdAt = oldUser.created;
    oldUser.updatedAt = oldUser.updated;
    if (/caishentang/.test(oldUser.signupSite)) oldUser.locale = 'zh_CN';
    if (!oldUser.ip) oldUser.ip = '0.0.0.0';
    processAffiliate(oldUser);
    var user = new User(oldUser);
    processWallet(oldUser);
    // console.log("saving user %s", user.primary());
    if (user.isValid()) {
        assert(user.createdAt());
        assert(user.updatedAt());
        userCol.insert(user.attrs, function(err) {
            if (err) {
                console.error(oldUser, user);
                throw err;
            }
            saveTracker.emit('saved', 'user');
            // console.log(" saved user %s", user.primary().toHexString());
        });
    } else {
        if (user.errors[0] && user.errors[0].attr === 'email') return; // if invalid email, discard the account
        console.error(user.errors, oldUser);
        process.exit();
    }
};

var processNotifications = function(userId, notes) {
    if (!notes) return;
    notes.forEach(function(oldNote) {
        Object.keys(oldNote).forEach(function(key) {
            if (oldNote[key] && 'object' === typeof oldNote[key]) {
                if (oldNote[key].$oid) {
                    oldNote[key] = oldNote[key].$oid;
                } else if (oldNote[key].$date) {
                    oldNote[key] = new Date(oldNote[key].$date);
                }
            }
        });
        if (!oldNote.message && oldNote.messae) oldNote.message = oldNote.messae;
        if ('string' !== typeof oldNote.message) return;
        if (!oldNote.subject) delete oldNote.subject;
        if (!oldNote._id && oldNote.id) oldNote._id = oldNote.id;
        oldNote.createdAt = oldNote.datetime;
        oldNote.updatedAt = oldNote.datetime;
        if (oldNote.hasRead) oldNote.readAt = oldNote.datetime;
        oldNote.userId = userId;
        var note = new Notification(oldNote);
        if (note.isValid()) {
            assert(note.createdAt());
            assert(note.updatedAt());
            noteCol.insert(note.attrs, function(err) {
                if (err) {
                    console.error(oldNote, note);
                    throw err;
                }
                saveTracker.emit('saved', 'note');
                // console.log(" saved note %s", note.primary().toHexString());
            });
        } else {
            console.error(note.errors);
            console.log(oldNote);
            console.log(note);
            process.exit();
        }

    });
};

var processWallet = function(oldUser) {
    var oldWallet = {
        userId: oldUser._id,
        currency: 'bitcoin',
        balance: oldUser.balance.btc || 0,
        lastWithdrawAt: oldUser.lastWithdraw,
        createdAt: oldUser.created,
        updatedAt: oldUser.updated
    };

    if (oldUser.availableBalance) {
        oldWallet.availableBalance = oldUser.availableBalance.btc || oldUser.balance.btc || 0;
    } else {
        oldWallet.availableBalance = oldUser.balance.btc || 0;
    }

    if (oldUser.withdraw && oldUser.withdraw.btc) {
        if (oldUser.withdraw.btc.address) oldWallet.withdrawAddress = oldUser.withdraw.btc.address;
        if (oldUser.withdraw.btc.backup && oldUser.withdraw.btc.backup.address) {
            oldWallet.withdrawBackup = oldUser.withdraw.btc.backup.address;
        }
    }

    if (oldUser.deposit && oldUser.deposit.btc) {
        oldWallet.depositAddress = oldUser.deposit.btc.address;
    }

    var wallet = new Wallet(oldWallet);
    if (wallet.isValid()) {
        assert(wallet.createdAt());
        assert(wallet.updatedAt());
        walletCol.insert(wallet.attrs, function(err) {
            if (err) {
                if (err.code === 11000) {
                    console.log("skipping duplicate withdraw address");
                    return;
                } else {
                    console.error(err.message, oldUser, wallet);
                    throw err;
                }
            }
            saveTracker.emit('saved', 'wallet');
            // console.log(" saved wallet %s", wallet.primary().toHexString());
        });
    } else {
        console.error(wallet.errors);
        console.log(oldWallet);
        console.log(wallet);
        process.exit();
    }

};

var affTxs = [];

var processTx = function(oldTx) {
    Object.keys(oldTx).forEach(function(key) {
        if (oldTx[key] && 'object' === typeof oldTx[key]) {
            if (oldTx[key].$oid) {
                oldTx[key] = oldTx[key].$oid;
            } else if (oldTx[key].$date) {
                oldTx[key] = new Date(oldTx[key].$date);
            }
        }
    });
    oldTx.meta = oldTx.meta || {};
    Object.keys(oldTx.meta).forEach(function(key) {
        if (oldTx.meta[key] && 'object' === typeof oldTx.meta[key]) {
            if (oldTx.meta[key].$oid) {
                oldTx.meta[key] = oldTx.meta[key].$oid;
            } else if (oldTx.meta[key].$date) {
                oldTx.meta[key] = new Date(oldTx.meta[key].$date);
            }
        }
    });
    if (!oldTx._id && oldTx.id) oldTx._id = oldTx.id;
    oldTx.credit = oldTx.amtIn;
    oldTx.debit = oldTx.amtOut;
    if (oldTx.type === 'withdraw' || oldTx.type === 'deposit') oldTx.meta.balance = oldTx.meta.balance || 0;
    oldTx.balance = oldTx.meta.balance || 0;
    oldTx.availableBalance = oldTx.meta.balance || 0;
    if (!oldTx.type) oldTx.type = "legacy";
    if (oldTx.type === 'affiliate:credit') {
        oldTx.type = 'affiliate';
    }
    oldTx.createdAt = oldTx.date;
    oldTx.updatedAt = oldTx.date;
    oldTx.currency = 'bitcoin';
    var tx = new Transaction(oldTx);
    if (tx.type() === Transaction.TYPE_AFFILIATE) affTxs.push(tx);
    if (tx.isValid()) {
        assert(tx.createdAt());
        assert(tx.updatedAt());
        txCol.insert(tx.attrs, function(err) {
            if(err) {
                if (err.code === 11000) {
                    console.log("skipping duplicate refId");
                    return;
                } else {
                    console.error(err.message, oldTx);
                    throw err;
                }
            }
            saveTracker.emit('saved', 'tx');
            // console.log(" saved tx %s", tx.primary().toHexString());
        });
    } else {
        console.error(tx.errors);
        console.log(oldTx);
        console.log(tx);
        process.exit();
    }

};
