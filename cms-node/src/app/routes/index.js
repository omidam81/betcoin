'use strict';

var mongo = require('mongowrap').getConnection();

module.exports = function(app) {

    //initialize routes
    var ticketRoutes = require('./tickets').Ticket;
    var wikiRoutes = require('./wiki').Wiki;
    var blogRoutes = require('./blog').Blog;
    var pressRoutes = require('./press').Press;

    mongo.getCollection('officedb', 'users', 'officedb', function(err, collection) {
        if (err) throw err;
        var auth = require('auth-npm')(collection);

        // Auth Routes
        app.get('/api/v1/auth', auth.getToken);
        app.get('/api/v1/logout', auth.destroyToken);

        // Ticket Routes
        app.post('/api/v1/ticket', ticketRoutes.create);
        app.get('/api/v1/ticket/:id', auth.checkToken, ticketRoutes.read);
        app.get('/api/v1/ticket/status/:status', auth.checkToken, ticketRoutes.reads);
        app.put('/api/v1/ticket/:id', auth.checkToken, ticketRoutes.update);
        app.put('/api/v1/ticket/comment/:id', ticketRoutes.updateWithComment);
        app.get('/api/v1/ticket/view/:id', ticketRoutes.read);

        // Blog Routes
        app.post('/api/v1/blog', auth.checkToken, blogRoutes.create);
        app.get('/api/v1/blog', blogRoutes.reads);
        app.get('/api/v1/blog/:blogId', blogRoutes.read);
        app.put('/api/v1/blog/:blogId', auth.checkToken, blogRoutes.update);
        app.delete('/api/v1/blog/:blogId', auth.checkToken, blogRoutes.delete);

        // Wiki Routes
        app.post('/api/v1/wiki', auth.checkToken, wikiRoutes.create);
        app.get('/api/v1/wiki', wikiRoutes.reads);
        app.get('/api/v1/wiki/:wikiId', wikiRoutes.read);
        app.put('/api/v1/wiki/:wikiId', auth.checkToken, wikiRoutes.update);
        app.delete('/api/v1/wiki/:wikiId', auth.checkToken, wikiRoutes.delete);

        // Press Routes
        app.post('/api/v1/press', auth.checkToken, pressRoutes.create);
        app.get('/api/v1/press', pressRoutes.reads);
        app.get('/api/v1/press/:pressId', pressRoutes.read);
        app.put('/api/v1/press/:pressId', auth.checkToken, pressRoutes.update);
        app.delete('/api/v1/press/:pressId', auth.checkToken, pressRoutes.delete);

    });
};
