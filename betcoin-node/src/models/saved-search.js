'use strict';

var timestamps = require('modella-timestamps');

module.exports = function(BaseModel, userModelStore) {
    var SavedSearch = BaseModel('saved_search')
        .attr('adminId', {type: userModelStore.ObjectId, required: true})
        .attr('admin', {type: 'string', required: true})
        .attr('query', {type: 'string', required: true})
        .attr('name', {type: 'string', required: true})
        .attr('global', {type: 'boolean', defaultValue: false})
        .attr('index', {type: 'number'});
    SavedSearch.use(userModelStore);
    SavedSearch.use(timestamps);
    return SavedSearch;
};
