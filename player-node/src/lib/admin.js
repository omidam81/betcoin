'use strict';

module.exports = function() {
    this.setContainer = function(container) {
        this.container = container;
    };

    this.getContainer = function() {
        return this.container;
    };

    this.getOfficeDb = function(cb) {
        var connection = this.getContainer().get('mongo').getConnection({
            url: 'MONGO_ALT_URL',
            user: 'MONGO_ALT_USER',
            password: 'MONGO_ALT_PASSWORD'
        });
        connection.getDb('officedb', function(err, db) {
            if (err) return cb(err);
            cb(undefined, db);
        });
    };
};