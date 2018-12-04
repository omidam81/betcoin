var moment = require('moment');
var sequelize = require('sequelize');

module.exports.generateModel = function(sequelizeConnection) {
  var model = sequelizeConnection.define('SportsEvent', {
    id: {
      type: sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    sport_id: sequelize.INTEGER,
    league_id: sequelize.INTEGER,
    starts_at: sequelize.DATE,
    pinnacle_gamenumber: { type: sequelize.INTEGER, unique: true }
  }, {
    instanceMethods: {
      starts_at_utc: function() { return moment(this.starts_at).utc().format(); },
      starts_at_str: function() { return moment(this.starts_at).utc().fromNow(); }
    }
  });

  model.sync();

  return model;
};

