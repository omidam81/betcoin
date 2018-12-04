'use strict';

var crypto = require('crypto');

var getPassword = function() {
    return crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
};

var yargs = require('yargs');
var argv = yargs
    .usage("Add an admin user\nUsage: $0 [--super] --email user@domain.org [--password passwordhere] username")
    .example("$0 -e foo@bar.com foo", "Make a new admin named foo")
    .example("$0 --super -e bar@foo.com bar", "Make a user with elevated priveledges named bar")
    .boolean("super")
    .count("super")
    .alias('s', 'super')
    .describe('s', "give the user elevated priveledges")
    .alias('e', 'email')
    .describe("e", "an email for ther user")
    .demand('email')
    .alias('p', "password")
    .describe("p", "supply a password, if none proveded a random one will be assigned")
    .default('p', getPassword())
    .demand(1)
    .help("help")
    .argv;
// argv.super == 1 means regular user
// argv.super == 2 means admin user
// argv.super == 3 means superadmin user

var container = require('../container');
var AdminUser = container.get('AdminUser');
var auth = container.get('auth');

var password = argv.password || getPassword();

auth.hashPassword(password, function(err, passHash) {
    var adminUser = new AdminUser({
        username: argv._[0],
        accessLevel: Math.abs(argv.super - 3),
        password: passHash
    });

    if (argv.email) adminUser.email(argv.email);

    adminUser.save(function(err) {
        if (err) {
            console.error(err.message, adminUser.errors.join(", "));
            console.log(yargs.help());
        }
        console.log("Added user");
        console.log("Username: %s", argv._[0]);
        console.log("Password: %s", password);
        process.exit();
    });
});
