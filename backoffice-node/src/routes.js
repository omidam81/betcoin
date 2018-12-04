'use strict';

var http = require('http');
var qr = require('qr-image');
var async = require('async');
module.exports = function(app, container) {
    // setup auth routes
    // var logger = container.get('logger');
    var mongo = container.get('mongo');
    var getExchangeRate = container.get('getExchangeRate');
    var AdminController = container.get('AdminController');
    var userCollection = mongo.getDb('officedb').collection('users');
    var coldStorageCollection = mongo.getDb('playerdb').collection('cold_storage_transactions');
    var bcauth = require('auth-npm')(userCollection);
    app.get('/auth', bcauth.getToken);
    app.get("/admin/security/qrcode/google-two-factor/:secret", function (req, res) {
        var code = qr.image('otpauth://totp/betcoin.tm?secret=' + req.params.secret.toString(), {size: 5});
        code.pipe(res);
    });
    app.get('*', bcauth.checkToken);
    app.post('*', bcauth.checkToken);
    app.put('*', bcauth.checkToken);

    app.get('/admin', function(req, res){
        res.json(req.user);
    });

    app.post("/admin/security/totp", function(req, res){
        AdminController.generateTotpSecret(req.user._id, function(err, secret){
            if(err) return res.json(err.code, err);
            res.json({totpSecret: secret});
        });
    });

    app.put("/admin/security/totp/activate/:oneTimePass", function (req, res) {
        var oneTimePass = req.params.oneTimePass;
        AdminController.activateTotp(req.user._id, oneTimePass, function(err, secret){
            if(err) return res.json(err.code, err);
            res.json({totpSecret: secret});
        });
    });

    app.put("/admin/security/totp/deactivate", function (req, res) {
        AdminController.deactivateTotp(req.user._id, function(err){
            if(err) return res.json(err.code, err);
            res.json(200);
        });
    });


    app.get('/exchangerate', function(req, res) {
        res.json(getExchangeRate());
    });
    app.get('/balance/:address', function(req, res) {
        http.get('http://blockchain.info/rawaddr/' + req.params.address, function(addrRes) {
            var data = '';
            addrRes.on('data', function(chunk) { data += chunk.toString(); });
            addrRes.on('end', function() {
                try {
                    var addrInfo = JSON.parse(data);
                    if (addrRes.statusCode === 200) {
                        res.json(addrInfo);
                    } else {
                        res.send(addrRes.statusCode, data);
                    }
                } catch (ex) {
                    if (addrRes.statusCode === 200) {
                        res.json(500, {error: 'JSON parse error', data: data});
                    } else {
                        res.send(addrRes.statusCode, {error: 'JSON parse error', data: data});
                    }
                }
            });
        });
    });
    app.get('/coldstorage/transactions', function(req, res) {
        var page = req.query.page || 1;
        var size = req.query.size || 30;
        var resultCursor;
        var results;
        var totalRecords;
        async.series([
            function(done) {
                resultCursor = coldStorageCollection.find().sort({date: -1});
                resultCursor.count(function(err, count) {
                    totalRecords = count;
                    done();
                });
            },
            function(done) {
                resultCursor.skip((page - 1) * size)
                    .limit(size)
                    .toArray(function(err, records) {
                        results = records;
                        done();
                });
            }
        ], function(err) {
            if (err) return res.json(err.code || 500, err);
            res.json({total: totalRecords, transactions: results});
        });
    });
};
