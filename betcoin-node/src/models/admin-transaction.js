'use strict';

var timestamps = require('modella-timestamps');

module.exports = function(BaseModel, userModelStore, CURRENCY_REGEXP) {
    var AdminTransaction = BaseModel('admin_transaction')
        .attr('adminId', {type: userModelStore.ObjectId})
        .attr('admin', {type: 'string'})
        .attr('currency', {format: CURRENCY_REGEXP})
        .attr('to', {type: 'string', required: true})
        .attr('refId', {type: 'string', required: true, unique: true})
        .attr('amount', {type: 'number', defaultValue: 0})
        .attr('type', {type: 'string', required: true})
        .attr('message', {format: /(.){7}/, required: true});

    AdminTransaction.use(userModelStore);
    AdminTransaction.use(timestamps);


    return AdminTransaction;
};
