var async = require('async');
var http = require("http");
var libxmljs = require("libxmljs");
var moment = require('moment');
var slug = require('slug');

module.exports.generateService = function(App) {
    var interval;

    function getPinnacleFeedAndUpdate() {
        App.Models.PinnacleOddsUpdate.findAll({order: "id DESC", limit: 1}).success(function(pinnacle_odds_updates) {
            var pinnacle_url = "http://xml.pinnaclesports.com/pinnacleFeed.aspx";
            if (pinnacle_odds_updates.length > 0) {
                pinnacle_url = pinnacle_url + "?last=" + pinnacle_odds_updates[0].pinnacle_feed_time;
            }

            console.log("Fetching url: " + pinnacle_url);
            var req = http.get(pinnacle_url, function(res){
                var data = '';

                res.on('data', function (chunk){
                    data += chunk;
                });

                res.on('end',function(){
                    parsePinnacleFeed(data);
                });
            });

            req.on('error', function(e) {
                console.log("getPinnacleFeed error: " + e);
            });
        });
    }

    function parsePinnacleFeed(data) {
        var xmlDoc;
        try {
            xmlDoc = libxmljs.parseXmlString(data);
        } catch (err) {
            console.log("Error parsing xml"+ err);
            return;
        }

        var pinnacle_line_feed = xmlDoc.root();
        var pinnacle_feed_time_el = pinnacle_line_feed.get("//PinnacleFeedTime");
        if (!pinnacle_feed_time_el) {
            console.log("Corrupt data");
            return;
        }

        var pinnacle_feed_time = pinnacle_feed_time_el.text();
        //console.log("Pinnacle feed time: " + pinnacle_feed_time);

        App.Models.PinnacleOddsUpdate.create({pinnacle_feed_time: pinnacle_feed_time});

        var events = pinnacle_line_feed.find("events/event");
        async.eachSeries(events, function(event, callback) {
            parseEventData(event, callback);
        }, function (err) {
            console.log("Finished");
        });
    };

    function parseEventData(event, callback) {
        var game_id = event.get("gamenumber").text();

        var game_starts_at = event.get("event_datetimeGMT").text();
        var starts_at = moment(game_starts_at + " +0000", "YYYY-MM-DD HH:mm Z").toDate();
        updateGameStartsAt(game_id, starts_at);

        var sport_type = event.get("sporttype").text();
        if (sport_type === "Basketball Props") {
            callback();
            return;
        }

        var league = event.get("league").text();

        var is_live_el = event.get("IsLive")
        if (!is_live_el) {
            // IsLive element not found
            callback();
            return;
        }
        var is_live = is_live_el.text();

        if (is_live !== "No") {
            // Game isn't live, skipping
            callback();
            return;
        }

        var periods = event.find("./periods/period");
        if (!periods) {
            // No periods found in game
            callback();
            return;
        }

        for (var j=0; j<periods.length; j++) {
            var period_el = periods[j];

            var period_number = period_el.get("period_number").text();
            if (period_number !== "0") {
                // Skipping period;
                continue;
            }

            var moneyline = period_el.get("moneyline");
            var spread = period_el.get("spread");
            var total = period_el.get("total");
            if (!(moneyline || spread || total)) {
                // No lines found in game
                callback();
                return;
            }

            var participant_home = null;
            var participant_visiting = null;
            var participant_draw = null;

            var participants = event.find("./participants/participant");

            for (var k=0; k<participants.length; k++) {
                var participant = participants[k];
                var participant_name = participant.get("participant_name").text();

                // Skip "Grand Salami" bets for now
                if (participant_name == "Home Runs" || participant_name == "Away Runs") {
                    callback();
                    return;
                }

                var participant_visiting_home_draw = participant.get("visiting_home_draw").text();
                var participant_contestantnum = participant.get("contestantnum").text();
                if (!participant_visiting_home_draw) {
                    // No visiting_home_draw;
                    callback();
                    return;
                } else if (participant_visiting_home_draw === "Visiting") {
                    participant_visiting = participant;
                } else if (participant_visiting_home_draw === "Home") {
                    participant_home = participant;
                } else if (participant_visiting_home_draw === "Draw") {
                    participant_draw = participant;
                } else {
                    // Unknown visiting_home_draw;
                    callback();
                    return;
                }
            }

            if ((!participant_home) || (!participant_visiting)) {
                // Home/visiting participants not detected
                callback();
                return;
            }

            handleSportLeagueEvent(sport_type, league, starts_at, game_id, participant_home, participant_visiting, participant_draw, period_el, callback)
            return;
        }
        callback();
    }

    function handleSportLeagueEvent(sport_name, league_name, starts_at, game_id, participant_home, participant_visiting, participant_draw, period_el, callback) {
        // @TODO consider making a cache for ids
        App.Models.Sport.find({where: {name: sport_name}}).success(function(sport) {

            if (sport) {
                handleLeagueEvent(sport.id, league_name, starts_at, game_id, participant_home, participant_visiting, participant_draw, period_el, callback);
            } else {
                App.Models.Sport.create({name: sport_name, slug: slug(sport_name).toLowerCase()}).success(function(sport) {
                    handleLeagueEvent(sport.id, league_name, starts_at, game_id, participant_home, participant_visiting, participant_draw, period_el, callback);
                });
            }
        });
    }

    function handleLeagueEvent(sport_id, league_name, starts_at, game_id, participant_home, participant_visiting, participant_draw, period_el, callback) {
        // @TODO consider making a cache for ids
        App.Models.SportsLeague.find({where: {name: league_name}}).success(function(league) {
            if (league) {
                handleEvent(sport_id, league.id, starts_at, game_id, participant_home, participant_visiting, participant_draw, period_el, callback);
            } else {
                App.Models.SportsLeague.create({sport_id: sport_id, name: league_name, slug: slug(league_name).toLowerCase()}).success(function(league) {
                    handleEvent(sport_id, league.id, starts_at, game_id, participant_home, participant_visiting, participant_draw, period_el, callback);
                });
            }
        });
    }

    function handleEvent(sport_id, league_id, starts_at, game_id, participant_home, participant_visiting, participant_draw, period_el, callback) {
        App.Models.SportsEvent.find({where: {pinnacle_gamenumber: game_id}}).success(function(event) {
            if (event) {
                createOrUpdateEventBetOdds(event, participant_home, participant_visiting, participant_draw, period_el, callback);
            } else {
                App.Models.SportsEvent.create({
                    sport_id: sport_id,
                    league_id: league_id,
                    starts_at: starts_at,
                    pinnacle_gamenumber: game_id
                }).success(function(event) {
                        async.parallel([
                            function(inner_callback) {
                                handleEventParticipant(event, "home", participant_home, inner_callback);
                            },
                            function(inner_callback) {
                                handleEventParticipant(event, "visiting", participant_visiting, inner_callback);
                            },
                            function(inner_callback) {
                                if (participant_draw) {
                                    handleEventParticipant(event, "draw", participant_draw, inner_callback);
                                } else {
                                    inner_callback();
                                }
                            }
                        ], function(err, results) {
                            createOrUpdateEventBetOdds(event, participant_home, participant_visiting, participant_draw, period_el, callback);
                        });
                    });
            }
        });
    }

    function createOrUpdateEventBetOdds(event, participant_home_el, participant_visiting_el, participant_draw_el, period_el, callback) {
        var participant_home_contestantnum = participant_home_el.get("contestantnum").text();
        var participant_visiting_contestantnum = participant_visiting_el.get("contestantnum").text();

        var fns = [];

        var moneyline_el = period_el.get("moneyline");
        if (moneyline_el) {
            var moneyline_visiting = moneyline_el.get("moneyline_visiting").text();
            var moneyline_home = moneyline_el.get("moneyline_home").text();
            var moneyline_draw_el = moneyline_el.get("moneyline_draw");

            fns.push(function(inner_callback) {
                var bet = {
                    contestantnum: participant_home_contestantnum,
                    type: "moneyline",
                    favor: moneyline_home
                };
                createOrUpdateBetOdds(event, bet, inner_callback);
            });
            fns.push(function(inner_callback) {
                var bet = {
                    contestantnum: participant_visiting_contestantnum,
                    type: "moneyline",
                    favor: moneyline_visiting
                };
                createOrUpdateBetOdds(event, bet, inner_callback);
            });

            if (participant_draw_el && moneyline_draw_el) {
                fns.push(function(inner_callback) {
                    var participant_draw_contestantnum = participant_draw_el.get("contestantnum").text();
                    var moneyline_draw = moneyline_draw_el.text();
                    var bet = {
                        contestantnum: participant_draw_contestantnum,
                        type: "moneyline",
                        favor: moneyline_draw
                    };
                    createOrUpdateBetOdds(event, bet, inner_callback);
                });
            }
        }

        var spread_el = period_el.get("spread");
        if (spread_el) {
            var spread_visiting = spread_el.get("spread_visiting").text();
            var spread_adjust_visiting = spread_el.get("spread_adjust_visiting").text();
            var spread_home = spread_el.get("spread_home").text();
            var spread_adjust_home = spread_el.get("spread_adjust_home").text();

            fns.push(function(inner_callback) {
                var bet = {
                    contestantnum: participant_visiting_contestantnum,
                    type: "spread",
                    spread: spread_visiting,
                    favor: spread_adjust_visiting
                };
                createOrUpdateBetOdds(event, bet, inner_callback);
            });
            fns.push(function(inner_callback) {
                var bet = {
                    contestantnum: participant_home_contestantnum,
                    type: "spread",
                    spread: spread_home,
                    favor: spread_adjust_home
                };
                createOrUpdateBetOdds(event, bet, inner_callback);
            });
        }

        var total_el = period_el.get("total");
        if (total_el) {
            var total_points = total_el.get("total_points").text();
            var over_adjust = total_el.get("over_adjust").text();
            var under_adjust = total_el.get("under_adjust").text();

            fns.push(function(inner_callback) {
                var bet = {
                    type: "total",
                    total_points: total_points,
                    total_side: "over",
                    favor: over_adjust
                };
                createOrUpdateBetOdds(event, bet, inner_callback);
            });
            fns.push(function(inner_callback) {
                var bet = {
                    type: "total",
                    total_points: total_points,
                    total_side: "under",
                    favor: under_adjust
                };
                createOrUpdateBetOdds(event, bet, inner_callback);
            });
        }

        async.parallel(fns, function(err, results) {
            callback();
        });
    }

    function handleEventParticipant(event, home_visiting_draw, participant_el, callback) {
        var participant_name = participant_el.get("participant_name").text();
        var participant_draw = participant_el.get("visiting_home_draw").text();
        var participant_contestantnum = participant_el.get("contestantnum").text();

        App.Models.SportsParticipant.find({
            where: {
                pinnacle_contestantnum: participant_contestantnum,
                pinnacle_gamenumber: event.pinnacle_gamenumber
            }
        }).success(function(participant) {
                if (participant) {
                    createEventParticipant(event, participant, participant_draw, callback);
                } else {
                    App.Models.SportsParticipant.create({
                        name: participant_name,
                        pinnacle_contestantnum: participant_contestantnum,
                        pinnacle_gamenumber: event.pinnacle_gamenumber
                    }).success(function(participant) {
                            createEventParticipant(event, participant, participant_draw, callback);
                        });
                }
            });
    }

    function createEventParticipant(event, participant, visiting_home_draw, callback) {
        App.Models.SportsEventParticipant.create({
            event_id: event.id,
            participant_id: participant.id,
            visiting_home_draw: visiting_home_draw
        }).success(function(sports_event_participant) {
                callback();
            });
    }

    function createOrUpdateBetOdds(event, bet, callback) {
        var bet_type = bet.type;
        if (bet_type === "moneyline") {
            var contestantnum = bet.contestantnum;
            App.Models.SportsParticipant.find({
                where: {
                    pinnacle_contestantnum: contestantnum,
                    pinnacle_gamenumber: event.pinnacle_gamenumber
                }
            }).success(function(participant) {
                    if (!participant) {
                        // This happened in E-Sports. Maybe there was a match scheduled but the participants changed?
                        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                        console.log("XXXXXXXXX  ERROR  XXXXXXXXXXXXXXXX");
                        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                        console.log("Can't find participant (" + contestantnum + ") for event (" + event.id + ")");
                        callback();
                        return;
                    }

                    bet.participant = participant;
                    App.Models.SportsBetOdd.find({
                        where: {
                            event_id: event.id,
                            participant_id: participant.id,
                            type: "moneyline",
                            expired_at: null
                        }
                    }).success(function(old_bet_odds) {
                            if (!old_bet_odds) {
                                createBetOdd(event, bet, callback);
                            } else {
                                var old_favor = old_bet_odds.favor;
                                var new_favor = parseInt(bet.favor);
                                if (old_favor != new_favor) {
                                    old_bet_odds.expired_at = new Date();
                                    old_bet_odds.save().success(function() {
                                        createBetOdd(event, bet, callback);
                                    });
                                } else {
                                    callback();
                                }
                            }
                        });
                });
        } else if (bet_type === "spread") {
            var contestantnum = bet.contestantnum;
            App.Models.SportsParticipant.find({
                where: {
                    pinnacle_contestantnum: contestantnum,
                    pinnacle_gamenumber: event.pinnacle_gamenumber
                }
            }).success(function(participant) {
                    if (!participant) {
                        // This happened in E-Sports. Maybe there was a match scheduled but the participants changed?
                        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                        console.log("XXXXXXXXX  ERROR  XXXXXXXXXXXXXXXX");
                        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                        console.log("Can't find participant (" + contestantnum + ") for event (" + event.id + ")");
                        callback();
                        return;
                    }

                    bet.participant = participant;
                    App.Models.SportsBetOdd.find({
                        where: {
                            event_id: event.id,
                            participant_id: participant.id,
                            type: "spread",
                            expired_at: null
                        }
                    }).success(function(old_bet_odds) {
                            if (!old_bet_odds) {
                                createBetOdd(event, bet, callback);
                            } else {
                                var old_favor = old_bet_odds.favor;
                                var new_favor = parseInt(bet.favor);
                                var old_spread = old_bet_odds.spread;
                                var new_spread = parseFloat(bet.spread);
                                if ((old_favor != new_favor) || (old_spread != new_spread)) {
                                    old_bet_odds.expired_at = new Date();
                                    old_bet_odds.save().success(function() {
                                        createBetOdd(event, bet, callback);
                                    });
                                } else {
                                    callback();
                                }
                            }
                        });
                });
        } else if (bet_type === "total") {
            App.Models.SportsBetOdd.find({
                where: {
                    event_id: event.id,
                    type: "total",
                    total_side: bet.total_side,
                    expired_at: null
                }
            }).success(function(old_bet_odds) {
                    if (!old_bet_odds) {
                        createBetOdd(event, bet, callback);
                    } else {
                        var old_favor = old_bet_odds.favor;
                        var new_favor = parseInt(bet.favor);
                        var old_total_points = old_bet_odds.total_points;
                        var new_total_points = parseFloat(bet.total_points);
                        if ((old_favor != new_favor) || (old_total_points != new_total_points)) {
                            old_bet_odds.expired_at = new Date();
                            old_bet_odds.save().success(function() {
                                createBetOdd(event, bet, callback);
                            });
                        } else {
                            callback();
                        }
                    }
                });
        }
    }

    function createBetOdd(event, bet, callback) {
        var favor = bet.favor;
        var payout = 0;
        if (favor < 0) {
            payout = 1 + (100.0 / (-1.0 * favor))
        } else {
            payout = 1 + (favor / 100.0)
        }

        var bet_type = bet.type;
        if (bet_type === "moneyline") {
            App.Models.SportsBetOdd.create({
                event_id: event.id,
                type: "moneyline",
                favor: favor,
                payout: payout,
                expired_at: null,
                participant_id: bet.participant.id
            }).success(function(sports_bet_odd) {
                    callback();
                });
        } else if (bet_type === "spread") {
            App.Models.SportsBetOdd.create({
                event_id: event.id,
                type: "spread",
                favor: favor,
                payout: payout,
                spread: bet.spread,
                expired_at: null,
                participant_id: bet.participant.id
            }).success(function(sports_bet_odd) {
                    callback();
                });
        } else if (bet_type === "total") {
            App.Models.SportsBetOdd.create({
                event_id: event.id,
                type: "total",
                favor: favor,
                payout: payout,
                total_points: bet.total_points,
                total_side: bet.total_side,
                expired_at: null
            }).success(function(sports_bet_odd) {
                    callback();
                });
        }
    }

    function updateGameStartsAt(game_id, starts_at) {
        App.Models.SportsEvent.find({where: ["pinnacle_gamenumber = ? and starts_at != ?", game_id, starts_at]}).success(function(sportsEvent) {
            if (!sportsEvent) {
                return;
            }

            sportsEvent.updateAttributes({
                startsAt: starts_at
            }).success(function() {});
        });
    }

    var service = {
        updateNow: function() {
            getPinnacleFeedAndUpdate();
        },
        startInterval: function() {
            var self = this;

            interval = setInterval(function() {
                self.updateNow();
            }, 2 * 60 * 1000);
        },
        stopInterval: function() {
            clearInterval(interval);
        }
    };

    return service;
}