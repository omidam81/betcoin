var sequelize = require('sequelize');
var config = require('./config.json')

module.exports.run = function(App) {
    //var passport = require('passport');
    //var LocalStrategy = require('passport-local').Strategy;
    //var MongoStore = require('connect-mongo')(express);

    App.sequelizeConnection = new sequelize(config.sq_database, config.sq_username, config.sq_password, config.sq_extra);

    App.Utils = {
        JWT: require('./utils/jwt.js').generateUtils(App),
        Message: require('./utils/message.js').generateUtils(App),
        Socket: require('./utils/socket.js').generateUtils(App),
        Transactions: require('./utils/transactions.js').generateUtils(App)
    };
    //
    //    var localStrategyOptions = { usernameField: 'email', passwordField: 'password' };
    //    passport.use(new LocalStrategy(localStrategyOptions, function(email, password, done) {
    //        User.find({where: {email: email}}).success(function(user) {
    //            if (user && user.verifyPassword(password)) {
    //                return done(null, user);
    //            } else {
    //                return done(null, false);
    //            }
    //        });
    //    }));
    //    passport.serializeUser(function(user, done) {
    //        done(null, user.id);
    //    });
    //    passport.deserializeUser(function(id, done) {
    //        User.find(id).success(function(user) {
    //            return done(null, user);
    //        });
    //    });

    App.Models = {
        SportsBet: require('./models/sports-bet.js').generateModel(App.sequelizeConnection),
        SportsBetOdd: require('./models/sports-bet-odd.js').generateModel(App.sequelizeConnection),
        SportsEvent: require('./models/sports-event.js').generateModel(App.sequelizeConnection),
        SportsEventOutcome: require('./models/sports-event-outcome.js').generateModel(App.sequelizeConnection),
        SportsEventParticipant: require('./models/sports-event-participant.js').generateModel(App.sequelizeConnection),
        SportsLeague: require('./models/sports-league.js').generateModel(App.sequelizeConnection),
        SportsParticipant: require('./models/sports-participant.js').generateModel(App.sequelizeConnection),
        PinnacleOddsUpdate: require('./models/pinnacle-odds-update.js').generateModel(App.sequelizeConnection),
        Sport: require('./models/sport.js').generateModel(App.sequelizeConnection),
        SportsWin: require('./models/sports-win.js').generateModel(App.sequelizeConnection)
    };
//@TODO create create script file that calls sync on all the models
    App.Models.SportsBet.belongsTo(App.Models.SportsEvent, {foreignKey: 'event_id'});
    App.Models.SportsBet.belongsTo(App.Models.SportsBetOdd, {foreignKey: 'bet_odd_id'});
    App.Models.SportsBetOdd.belongsTo(App.Models.SportsEvent, {foreignKey: 'event_id'});
    App.Models.SportsBetOdd.belongsTo(App.Models.SportsParticipant, {foreignKey: 'participant_id'});
    App.Models.SportsWin.belongsTo(App.Models.Sport, {foreignKey: 'sport_id'});
    App.Models.SportsWin.belongsTo(App.Models.SportsLeague, {foreignKey: 'league_id'});
    App.Models.SportsEvent.belongsTo(App.Models.Sport, {foreignKey: 'sport_id'});
    App.Models.SportsEvent.belongsTo(App.Models.SportsLeague, {foreignKey: 'league_id'});
    App.Models.SportsEvent.hasOne(App.Models.SportsEventOutcome, {foreignKey: 'sports_event_id'});
    App.Models.SportsEvent.hasMany(App.Models.SportsBetOdd, {foreignKey: 'event_id'});
    App.Models.SportsEvent.hasMany(App.Models.SportsEventParticipant, {foreignKey: 'event_id'});
    App.Models.SportsEventParticipant.belongsTo(App.Models.SportsParticipant, {foreignKey: 'participant_id'});
    App.Models.SportsLeague.belongsTo(App.Models.Sport, {foreignKey: 'sport_id'});
    App.Models.Sport.hasMany(App.Models.SportsLeague, {foreignKey: 'sport_id'});

};