'use strict';

var timestamps = require('modella-timestamps');

module.exports = function(BaseModel, userModelStore) {

    var AdminUser = BaseModel('admin')
        .attr('username', {required: true, unique: true})
        .attr('accessLevel', {type: 'number', defaultValue: 2})
        .attr('email', {format: 'email', required: true})
        .attr('password', {filtered: true})
        .attr('ip', {format: /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/})
        .attr('token', {defaultValue: false})
        .attr('totp', {defaultValue: false})
        .attr('disable', {defaultValue: false})
        .attr('totpSecret', {defaultValue: false});

    AdminUser.use(userModelStore);
    AdminUser.use(timestamps);

    return AdminUser;
};
