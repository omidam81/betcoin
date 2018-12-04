var async = require('async');
var semaphore = require('semaphore');
var placeBetSemaphore = semaphore(1);

module.exports = function(App) {
  return {
    placeBet: function(req, res, next) {
      var bet_odd_id = parseInt(req.body.bet_odd_id);
      var bet_amount = parseFloat(req.body.bet_amount);
      var address = req.session.wallet_address;

      if (!bet_odd_id) {
        App.logger.info("No bet odd id");
        req.flash("error", "We couldn't find the odds that you tried to bet on");
        res.redirect('/account/sports');
        return;
      }

      SportsBetOdd.find({where: {"SportsBetOdds.id": bet_odd_id}, include: [ SportsEvent ]}).success(function(betOdd) {
        var sportsEvent = betOdd.sportsEvent;

        if (!betOdd) {
          App.logger.info("No bet odd");
          req.flash("error", "We couldn't find the odds that you tried to bet on");
          res.redirect('/account/sports');
          return;
        }

        if (betOdd.expired_at) {
          App.logger.info("Expired bet odd");
          req.flash("error", "The odds have changed on the bet you tried to place");
          redirectToSportsLeagueFromEvent(req, res, sportsEvent);
          return;
        }

        if (sportsEvent.starts_at < new Date()) {
          App.logger.info("Event already started");
          req.flash("error", "The event has already started");
          redirectToSportsLeagueFromEvent(req, res, sportsEvent);
          return;
        }

        if (!bet_amount) {
          App.logger.info("Invalid bet amount");
          req.flash("error", "Please bet a valid amount");
          redirectToSportsLeagueFromEvent(req, res, sportsEvent);
          return;
        }

        placeBetSemaphore.take(function() {
          App.utils.getBalance(address, function(balance) {
            if (balance < bet_amount) {
              App.logger.info("Not enough balance");
              placeBetSemaphore.leave();
              req.flash("error", "You don't have enough available balance to place that bet");
              redirectToSportsLeagueFromEvent(req, res, sportsEvent);
              return;
            }

            if (bet_amount > 2) {
              App.logger.info("Max sports bet exceeded: " + bet_amount);
              placeBetSemaphore.leave();
              req.flash("error", "You've tried to place a bet that is greater than the maximum currently allowed");
              redirectToSportsLeagueFromEvent(req, res, sportsEvent);
              return;
            }

            if (bet_amount < 0.02) {
              App.logger.info("Min sports bet not met: " + bet_amount);
              placeBetSemaphore.leave();
              req.flash("error", "You've tried to place a bet that is below than the minimum currently allowed");
              redirectToSportsLeagueFromEvent(req, res, sportsEvent);
              return;
            }

            var message = "Placed bet on bet_odd: " + bet_odd_id;
            App.utils.updateBalance(address, bet_amount, -1 * bet_amount, message, false, function() {
              SportsBet.create({
                address: address,
                event_id: betOdd.event_id,
                bet_odd_id: bet_odd_id,
                bet: bet_amount,
                status: "open"
              }).success(function(bet) {
                placeBetSemaphore.leave();

                var sportsVolume = Math.min(bet_amount, bet_amount * (betOdd.payout - 1.0));
                CommissionRecord.trackCommission(address, sportsVolume);

                req.flash("info", "Bet successfully placed");
                return res.redirect('/account/sports');
              });
            });
          });
        });
      });
    },
    showSport: function(req, res, next) {
      var sportSlug = req.params.sportSlug;
      Sport.find({where: {slug: sportSlug}}).success(function(sport) {
        if (!sport) {
          return res.redirect('/');
        }

        App.sequelize.query("select slug from \"SportsEvents\" inner join \"SportsLeagues\" on \"SportsLeagues\".id = \"SportsEvents\".league_id where \"SportsLeagues\".sport_id=" + sport.id + " and starts_at > now() group by slug having count(league_id) > 0").success(function(rows) {
          if (rows.length == 0) {
            SportsLeague.findAll({where: {sport_id: sport.id}}).success(function(leagues) {
              return res.render('sports/sport-inactive', {sport: sport, leagues: leagues});
            });
            return;
          }

          var slug = rows[0].slug;
          return res.redirect('/sports/' + sport.slug + '/' + slug);
        });
      });
    },
    showLeague: function(req, res, next) {
      var sportSlug = req.params.sportSlug;
      var leagueSlug = req.params.leagueSlug;
      Sport.find({where: {slug: sportSlug}}).success(function(sport) {
        if (!sport) {
          return res.redirect('/');
        }

        SportsLeague.findAll({where: {sport_id: sport.id}}).success(function(leagues) {
          App.sequelize.query("select league_id, count(league_id) from \"SportsEvents\" where sport_id=" + sport.id + " and starts_at > now() group by league_id ").success(function(rows) {
            var activeEventsCounts = {}
            for (var i=0; i<rows.length; i++) {
              var row = rows[i];
              var league_id = row.league_id;
              var count = row.count;
              activeEventsCounts[league_id] = count;
            }

            var league = null;
            for (var i=0; i<leagues.length; i++) {
              var i_league = leagues[i];
              i_league.activeEventsCount = (activeEventsCounts[i_league.id] || 0);
              if (i_league.slug == leagueSlug) {
                league = i_league;
              }
            }

            if (!league) {
              return res.redirect('/sports/' + sport.slug);
            }

            SportsEvent.findAll({
              where: ["starts_at > ? and sport_id = ? and league_id = ?", new Date(), sport.id, league.id],
              order: "starts_at asc",
              include: [ SportsEventParticipant ]
            }).success(function(events) {
              async.each(events, function(event, callback) {
                async.each(event.sportsEventParticipants, function(eventParticipant, inner_callback) {
                  SportsBetOdd.findAll({
                    where: {
                      event_id: event.id,
                      expired_at: null
                    }
                  }).success(function(sportsBetOdds) {
                    event.sportsBetOdds = sportsBetOdds;
                    SportsParticipant.find(eventParticipant.participant_id).success(function(participant) {
                      eventParticipant.sportsParticipant = participant;

                      var sportsBetOdds = event.sportsBetOdds;
                      for (var i=0; i<sportsBetOdds.length; i++) {
                        var sportsBetOdd = sportsBetOdds[i];
                        if (sportsBetOdd.participant_id == participant.id) {
                          sportsBetOdd.participant = participant;
                        }
                      }

                      inner_callback();
                    });
                  });
                }, function(err) {
                  callback();
                });
              }, function(err) {
                return res.render('sports/league', {sport: sport, leagues: leagues, league: league, events: events});
              });
            });
          });
        });
      });
    }
  }
}

function redirectToSportsLeagueFromEvent(req, res, sportsEvent) {
  var eventSport;
  var eventLeague;

  async.parallel([function(callback) {
    Sport.find(sportsEvent.sport_id).success(function(sport) {
      eventSport = sport;
      callback();
    });
  }, function(callback) {
    SportsLeague.find(sportsEvent.league_id).success(function(league) {
      eventLeague = league;
      callback();
    });
  }], function(err, results) {
    res.redirect('/sports/' + eventSport.slug + '/' + eventLeague.slug);
      return;
  });
}

