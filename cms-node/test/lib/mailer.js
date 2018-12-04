var should = require('should');
var mailer = require('./../../app/lib/mailer').MailNotifier;
var ticket = {"_id" : "5305c840fea767075849547a", email: "bethoveen.todino@gmail.com", name: "Bethoveen" };

mailer.sendMessage(ticket, function(err, result){
	if(err) {
		console.log(err);
	} else {
		console.log('sent');
	}
});