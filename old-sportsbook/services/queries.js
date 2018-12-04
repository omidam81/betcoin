var async = require("async");
var validator = require("validator");

module.exports.generateService = function (App) {
    // user dashboard
    // bet on game
    // @TODO notify user of win?

    // admin only: set game result
    // admin only: view all bets on game
    // admin only: all sorts of stats.

    //@TODO handle auth sessions

    //@TODO optimize foreign keys

    //@TODO cache - memcached or just use js object?

    function trimExpiredBetOdds(event) { //@TODO move to utils?
        var newBetOdds = [];
        event = event.values;

        event.sportsBetOdds.forEach(function (element) {
            if (element.expired_at === null) {
                newBetOdds.push(element);
            }
        });

        event.sportsBetOdds = newBetOdds;

        return event;
    }

    function fetchSportsEventsWhere(params, callback) {
        var limit = params.limit;
        var where = params.where;

        App.Models.SportsEvent.findAll({
            where: where,
            order: "starts_at ASC",
            limit: limit ? limit : 5,
            include: [
                App.Models.Sport,
                App.Models.SportsLeague,
                {
                    model: App.Models.SportsBetOdd
                },
                {
                    model: App.Models.SportsEventParticipant,
                    include: [ App.Models.SportsParticipant ]
                }
            ]
        }).complete(function (err, result) {
            // sequelize has a bug in eager loading with where clauses,
            // so we're manually trimming expired sportsBetOdds
            callback(err, result.map(trimExpiredBetOdds));
        });
    }

    var queries = {
        /*
         * params: {
         *      leagueSlug: undefined or string with the slug of the game for which it is requested,
         *          XOR
         *      sportSlug: undefined or string with the slug of the league for which it is requested
         *  }
         * callback: async.parallel callback
         */
        upcomingEvents: function (params, callback) {
            if (params && params.leagueSlug) { //@TODO abstract this
                App.Models.SportsLeague.find({
                    where: {
                        slug: params.leagueSlug
                    }
                }).complete(function (err, result) {
                    if (err === null && result !== null) {
                        fetchSportsEventsWhere({ where: { league_id: result.id } }, callback);
                    } else if (result === null) {
                        callback("Could not find league", result);
                    } else {
                        callback(err, result);
                    }
                });
            } else if (params && params.sportSlug) {
                App.Models.Sport.find({
                    where: {
                        slug: params.sportSlug
                    }
                }).complete(function (err, result) {
                    if (err === null) {
                        fetchSportsEventsWhere({ where: { sport_id: result.id } }, callback);
                    } else {
                        callback("Could not find sport", result);
                    }
                });
            } else {
                fetchSportsEventsWhere({ where: {} }, callback);
            }
        },
        /*
         * params: {
         *      leagueSlug: undefined or string with the slug of the league for which it is requested,
         *          XOR
         *      sportSlug: undefined or string with the slug of the sport for which it is requested
         *  }
         * callback: async.parallel callback
         */
        hottestEvents: function (params, callback) {
            this.upcomingEvents(params, callback); // @TODO just use this for now
        },
        /*
         * params: undefined
         * callback: async.parallel callback
         */
        latestWins: function (params, callback) {
            //@TODO
            // @TODO might want to consider making a different query that extracts the highest wins this week
            App.Models.SportsWin.findAll({
                limit: 5,
                include: [
                    App.Models.Sport,
                    App.Models.SportsLeague
                ]
            }).complete(function(err, result) {
                if(result) {
                    // everything went fine, we have the latestWins
                    callback(null, result);
                } else {
                    // error
                    callback(err,result);
                }
            });
            /* callback(null, [{
             amount: 1.165434,
             currency: "BTC",
             username: "Anonymous",
             game: "Olympia Football"
             },
             {
             amount: 0.312356,
             currency: "BTC",
             username: "Anonymous",
             game: "Olympia DOTA"
             },
             {
             amount: 0.014556,
             currency: "BTC",
             username: "Anonymous",
             game: "Roulette"
             }]);*/
        },
        /*
         * params: undefined
         * callback: async.parallel callback
         */
        spotlightSport: function (params, callback) {
            App.Models.Sport.find({
                order: "random()"
            }).complete(function (err, sportResult) {
                if (err === null) {
                    fetchSportsEventsWhere({ where: { sport_id: sportResult.id } }, function (err, eventsResult) {
                        callback(err, {sport: sportResult, events: eventsResult});
                    });
                } else {
                    callback(err, sportResult);
                }

            });
        },
        /*
         * params: {
         *      sportSlug: string with the slug of the sport for which it is requested
         *  }
         * callback: async.parallel callback
         */
        spotlightLeague: function (params, callback) {
            var sportSlug = validator.toString(params.sportSlug);

            App.Models.Sport.find({
                where: { slug: sportSlug }
            }).complete(function (err, sportResult) {
                if (err === null) {
                    App.Models.SportsLeague.findAll({
                        where: { sport_id: sportResult.id }
                    }).complete(function (err, leaguesResult) {

                            //@TODO this is really inefficient but order: rand() does not respect the where
                            var rand = Math.floor(Math.random()*leaguesResult.length);
                            var leagueResult = leaguesResult[rand];

                            if (err === null) {
                                fetchSportsEventsWhere({ where: { league_id: leagueResult.id } }, function (err, eventsResult) {
                                    callback(err, {league: leagueResult, events: eventsResult});
                                });
                            } else {
                                callback(err, leagueResult);
                            }
                        });
                } else {
                    callback(err, sportResult);
                }

            });


        },
        /*
         * params: undefined
         * callback: async.parallel callback
         */
        olympiaSports: function (params, callback) {
            App.Models.Sport.findAll({
                include: [App.Models.SportsLeague]
            }).complete(function (err, result) {
                callback(err, result);
            });
        },
        /*
         * params: {
         *      sportSlug: the slug string of the sport whose data is requested
         *  }
         * callback: async.parallel callback
         */
        sportData: function(params, callback) {
            var sportSlug = validator.toString(params.sportSlug);

            App.Models.Sport.find({
                where: { slug: sportSlug },
                include: [ App.Models.SportsLeague ]
            }).complete(function(err, result) {
                if(result) {
                    // everything went fine, we have the sport
                    callback(null, result);
                } else {
                    // error
                    callback(err,result);
                }
            });
        },
        /*
         * params: {
         *      leagueSlug: the slug string of the league whose data is requested
         *  }
         * callback: async.parallel callback
         */
        leagueData: function(params, callback) {
            var leagueSlug = validator.toString(params.leagueSlug);

            App.Models.SportsLeague.find({
                where: {slug: leagueSlug}
            }).complete(function(err, result) {
                if(result) {
                    // everything went fine, we have the league and events
                    fetchSportsEventsWhere({ where: { league_id: result.id }, limit: null }, function (err, eventsResult) {
                        callback(err, {league: result, events: eventsResult});
                    });
                } else {
                    // error
                    callback(err,result);
                }
            });
        },
        /*
         * params: {
         *      eventId: the id of the event whose data is requested
         *  }
         * callback: async.parallel callback
         */
        eventData: function (params, callback) {
            var eventId = validator.toInt(params.eventId);

            fetchSportsEventsWhere({
                where: {
                    id: eventId
                }
            }, function (err, data) {
                if (Array.isArray(data)) {
                    // everything went fine, we have the events array, we return the first element
                    callback(null, data[0]);
                } else {
                    // whoops, pipe the error through
                    callback(err, data);
                }
            });
        }
    };

    var service = {
        /*
         * data : array of { name: string queryname, params: object containing query params }
         * callback : socket.io callback
         */
        doQuery: function (data, callback) {
            var parallelQueries = {};

            data.forEach(function (value) {
                var name = validator.toString(value.name);
                var params = value.params;

                if (typeof params !== "undefined" && typeof params !== "object") {
                    throw new Error("Invalid format for query params: " + typeof params);
                }

                if (typeof queries[name] === "undefined") {
                    throw new Error("Could not find query: " + value.name);
                }

                //@TODO check if there is any risk to access some nasty functions via prototype

                parallelQueries[name] = function (parallelCallback) {
                    queries[name](params, parallelCallback);
                }
            });

            async.parallel(parallelQueries, function (err, results) {
                if (err === null) {
                    callback(err, results);
                } else {
                    //@TODO log stuff
                    callback(err, null);
                }
            });
        }
    };

    return service;
};