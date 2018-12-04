'use strict';

var async = require('async');
var mandrill = require('mandrill-api');
var mail = new mandrill.Mandrill(process.env.MANDRILL_KEY);
var path = require('path');
var extend = require('util')._extend;

var fs = require('fs');
var ejs = require('ejs');

var WEB_URL = "www.betcoin.tm";

var emailTemplate = fs.readFileSync(path.normalize(__dirname + '/../templates/email.html')).toString();

var EMAIL = {
    confirm: {
        subject: {
            en_US: "BetCoin email confirmation",
            zh_CN: "确认邮件地址－财神堂",
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/confirm.html')).toString()
    },
    confirmed: {
        subject: {
            en_US: "BetCoin email confirmed",
            zh_CN: "已确认邮件地址－财神堂",
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/confirmed.html')).toString()
    },
    contact_us: {
        subject: {
            en_US: "Customer message",
            zh_CN: "Customer message"
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/customer_message.html')).toString()
    },
    ticket: {
        subject: {
            en_US: 'Ticket Updates',
            zh_CN: '新的回复－财神堂',
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/ticket.html')).toString()
    },
    password_reset: {
        subject: {
            en_US: "Password Reset",
            zh_CN: "Password Reset"
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/password_reset.html')).toString()
    },
    backoffice_email: {
        subject: {
            en_US: 'Betcoin Message from Support Team',
            zh_CN: '来自财神堂的信息',
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/backoffice_message.html')).toString()
    },
    bonus_offer: {
        subject: {
            en_US: 'Claim your <%= params.data.type %> bonus',
            zh_CN: '快来获取<%if (params.data.type == "match"){ %>充值竞赛<% } if (params.data.type == "welcome") {%>欢迎<%} if (params.data.type == "straight"){%>立马<%}%>奖励',
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_offer.html')).toString()
    },
    bonus_accepted: {
        subject: {
            en_US: 'Your <%= params.data.type %> bonus has been accepted!',
            zh_CN: '<%if (params.data.type == "match"){ %>充值竞赛<% } if (params.data.type == "welcome") {%>欢迎<%} if (params.data.type == "straight"){%>立马<%}%> 奖励已经被接收!',
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_accepted.html')).toString()
    },
    bonus_activated: {
        subject: {
            en_US: 'Your <%= params.data.type %> bonus has been activated!',
            zh_CN: '<%if (params.data.type == "match"){ %>充值竞赛<% } if (params.data.type == "welcome") {%>欢迎<%} if (params.data.type == "straight"){%>立马<%}%> 奖励已经被激活!',
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_activated.html')).toString()
    },
    bonus_unlocked: {
        subject: {
            en_US: 'Your <%= params.data.type %> bonus has been unlocked!',
            zh_CN: '<%if (params.data.type == "match"){ %>充值竞赛<% } if (params.data.type == "welcome") {%>欢迎<%} if (params.data.type == "straight"){%>立马<%}%> 奖励额度已经被解锁!',
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_unlocked.html')).toString()
    },
    cashback_granted: {
        subject: {
            en_US: 'You have earned a cashback bonus',
            zh_CN: '您已获得现金返还奖励',
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/cashback_granted.html')).toString()
    },
    win_lottery: {
        subject:{
            en_US: 'You have won the lottery!',
            zh_CN: '您已赢得抽奖!'
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/win_lottery.html')).toString()
    },
    cashout_request_cancelled: {
        subject:{
            en_US: 'Cashout Request Cancelled',
            zh_CN: 'Cashout Request Cancelled'
        },
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/cashout_request_cancelled.html')).toString()
    }
};

module.exports = function(logger, User, HTTPError) {
    var EmailService = function() {
    };

    EmailService.prototype.sendBasic = function(email, subject, message, cb) {
        var emails = [];
        if (!Array.isArray(email)) {
            emails = [{email: email, type: "to"}];
        } else {
            email.forEach(function(thisEmail) {
                emails.push({email: thisEmail, type: "to"});
            });
        }
        if (!cb) {
            cb = function(err) {
                if (err) logger.error("Error sending email: %s", err.message);
            };
        }
        var messageObj = {
            "text": message,
            "subject": subject,
            "from_email": "noreply@betcoin.tm",
            "from_name": "BetCoin Backoffice",
            "to": emails
        };
        mail.messages.send({
            "message": messageObj,
            "async": true,
            "ip_pool": "Main Pool"
        }, function(d) {
            if (d[0].status === 'invalid') {
                var err = d[0];
                logger.error(err, {});
                return cb(new HTTPError(500, 'invalid email %s', err.email));
            }
            logger.info(d, {});
            cb();
        }, function(err) {
            if (err.code === -1 && err.message === "Invalid API key") {
                logger.warn("missing mandrill key");
                return cb();
            }
            cb(new HTTPError(err));
        });
    };

    EmailService.prototype.send = function(email, template, options, cb) {
        if (cb === undefined) cb = function(err) {
            if (err) return logger.error("EmailService.send error: %s", err.message);
        };
        var emails;
        var message = {};
        var tasks = [
            function sendTheMail(done) {
                if(options.user) {
                    options.locale = options.user.locale();
                } else {
                    options.locale = options.locale || 'en_US';
                }
                if (options.user && options.user.toJSON && 'function' === typeof options.user.toJSON) {
                    options.user = options.user.toJSON();
                }

                if(!EMAIL[template]) return cb(new HTTPError(404, 'email template not found'));
                var subject = EMAIL[template].subject[options.locale];
                subject = ejs.render(subject, options);
                options = extend({ WEB_URL: WEB_URL }, options);
                var body = ejs.render(EMAIL[template].body, options);
                body = ejs.render(emailTemplate, {
                    body: body,
                    subject: subject
                });
                var emails = [];
                if (!message.to) {
                    if (!Array.isArray(email)) {
                        emails = [{email: email, type: "to"}];
                    } else {
                        email.forEach(function(thisEmail) {
                            emails.push({email: thisEmail, type: "to"});
                        });
                    }
                    message.to = emails;
                }
                message.html = body;
                message.subject = subject;
                message.from_email = "noreply@betcoin.tm";
                message.from_name = "BetCoin ™ VIP";
                // set from name and email for locales
                if (options.locale === 'zh_CN') {
                    message.from_email = "noreply@caishentang.com";
                    message.from_name = "财神堂™VIP";
                }
                mail.messages.send({
                    "message": message,
                    "async": true,
                    "ip_pool": "Main Pool"
                }, function(d) {
                    if (d[0].status === 'invalid') {
                        var err = d[0];
                        logger.error(err, {});
                        return done(new HTTPError(500, 'invalid email %s', err.email));
                    }
                    var response = d[0];
                    logger.info("%s to %s", response.status, response.email, response);
                    done();
                }, function(err) {
                    done(new HTTPError(err.code, err.message));
                });
            }
        ];
        if (email instanceof User.db.id) {
            tasks.unshift(function getTheUser(done) {
                User.get({_id: email}, function(err, user) {
                    if (err) return done(new HTTPError(err.code, err.message));
                    if (!user.email() && !user.pendingEmail()) return done(new HTTPError(412, "User has no email address"));
                    emails = message.to = [{email: user.email() || user.pendingEmail(), type: "to"}];
                    options.user = user;
                    done();
                });
            });
        }

        if (!process.env.MANDRILL_KEY) {
            logger.warn("No Mandrill API key found in environment, not actually sending email");
            return cb();
        } else {
            async.series(tasks, function(err) {
                return cb(err);
            });
        }
    };

    if (process.env.ADMIN_EMAILS) {
        EmailService.prototype.ADMINS = process.env.ADMIN_EMAILS.split(',');
    } else {
        EmailService.prototype.ADMINS = ['webadmin@betcoin.tm', 'webmaster@betcoin.tm'];
    }


    return new EmailService();
};
