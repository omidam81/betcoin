'use strict';

var logger = require('./logger')('main');
var mandrill = require('mandrill-api');
var mail = new mandrill.Mandrill(process.env.MANDRILL_KEY);
var path = require('path');
var extend = require('util')._extend;

var fs = require('fs');
var ejs = require('ejs');

var WEB_URL = "www.betcoin.tm";

if (process.env.NODE_ENV !== "production") {
    WEB_URL = "frontdev.betcoin.tm";
}

var emailTemplate = fs.readFileSync(path.normalize(__dirname + '/../templates/email.html')).toString();

var EMAIL = {
    confirm: {
        subject: "BetCoin email confirmation",
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/confirm.html')).toString()
    },
    confirm_cn: {
        subject: "确认邮件地址－财神堂",
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/confirm_cn.html')).toString()
    },
    confirmed: {
        subject: "BetCoin email confirmed",
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/confirmed.html')).toString()
    },
    confirmed_cn: {
        subject: "已确认邮件地址－财神堂",
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/confirmed_cn.html')).toString()
    },
    contact_us: {
        subject: "Customer message",
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/customer_message.html')).toString()
    },
    ticket: {
        subject: 'Ticket Updates',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/ticket.html')).toString()
    },
    ticket_cn: {
        subject: '新的回复－财神堂',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/ticket_cn.html')).toString()
    },
    backoffice_email: {
        subject: 'Betcoin Message from Support Team',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/backoffice_message.html')).toString()
    },
    backoffice_email_cn: {
        subject: '来自财神堂的信息',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/backoffice_message_cn.html')).toString()
    },
    bonus_offer: {
        subject: 'Claim your <%= params.data.type %> bonus',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_offer.html')).toString()
    },
    bonus_offer_cn: {
        subject: '快来获取<%if (params.data.type == "match"){ %>充值竞赛<% } if (params.data.type == "welcome") {%>欢迎<%} if (params.data.type == "straight"){%>立马<%}%>奖励',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_offer_cn.html')).toString()
    },
    bonus_accepted: {
        subject: 'Your <%= params.data.type %> bonus has been accepted!',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_accepted.html')).toString()
    },
    bonus_accepted_cn: {
        subject: '<%if (params.data.type == "match"){ %>充值竞赛<% } if (params.data.type == "welcome") {%>欢迎<%} if (params.data.type == "straight"){%>立马<%}%> 奖励已经被接收!',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_accepted_cn.html')).toString()
    },
    bonus_activated: {
        subject: 'Your <%= params.data.type %> bonus has been activated!',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_activated.html')).toString()
    },
    bonus_activated_cn: {
        subject: '<%if (params.data.type == "match"){ %>充值竞赛<% } if (params.data.type == "welcome") {%>欢迎<%} if (params.data.type == "straight"){%>立马<%}%> 奖励已经被激活!',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_activated_cn.html')).toString()
    },
    bonus_unlocked: {
        subject: 'Your <%= params.data.type %> bonus has been unlocked!',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_unlocked.html')).toString()
    },
    bonus_unlocked_cn: {
        subject: '<%if (params.data.type == "match"){ %>充值竞赛<% } if (params.data.type == "welcome") {%>欢迎<%} if (params.data.type == "straight"){%>立马<%}%> 奖励额度已经被解锁!',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/bonus_unlocked_cn.html')).toString()
    },
    cashback_granted: {
        subject: 'You have earned a cashback bonus',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/cashback_granted.html')).toString()
    },
    cashback_granted_cn: {
        subject: '您已获得现金返还奖励',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/cashback_granted_cn.html')).toString()
    },
    win_lottery: {
        subject: 'You have won the lottery!',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/win_lottery.html')).toString()
    },
    win_lottery_cn: {
        subject: '您已赢得抽奖!',
        body: fs.readFileSync(path.normalize(__dirname + '/../templates/email/win_lottery_cn.html')).toString()
    }
};

if (!process.env.MANDRILL_KEY) {
    throw "MANDRILL_KEY environment variable not set";
}

var EmailService = function() {
    this.send = function(email, template, options, cb) {
        if (cb === undefined) cb = function(err) {
            if (err) return logger.error("EmailService.send error: %s", err.message);
        };

        if(options.user && options.user.signupSite && options.user.signupSite.indexOf('caishentang') !== -1){
            template = template + '_cn';
        }

        if(!EMAIL[template]) return cb({code: 400, message: 'email template not found', errCode: '074'});
        var subject = EMAIL[template].subject;
        subject = ejs.render(subject, options);
        options = extend({ WEB_URL: WEB_URL }, options);
        var body = ejs.render(EMAIL[template].body, options);
        body = ejs.render(emailTemplate, {
            body: body,
            subject: subject
        });
        var message = {
            "html": body,
            "subject": subject,
            "from_email": "noreply@betcoin.tm",
            "from_name": "BetCoin ™ VIP",
            "to": [{
                "email": email,
                "type": "to"
            }]
        };
        mail.messages.send({
            "message": message,
            "async": true,
            "ip_pool": "Main Pool"
        }, function(d) {
            logger.info(d);
            cb();
        }, function(err) {
            cb(err);
        });
    };
};

module.exports = EmailService;
