var sequelize = require('sequelize');

module.exports.generateModel = function(sequelizeConnection) {
  var model = sequelizeConnection.define('SportsEventOutcome', {
    id: {
      type: sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    sports_event_id: {type: sequelize.INTEGER, unique: true},
    winning_participant_id: sequelize.INTEGER,
    home_participant_id: sequelize.INTEGER,
    home_score: sequelize.DECIMAL(15,8),
    visiting_participant_id: sequelize.INTEGER,
    visiting_score: sequelize.DECIMAL(15,8)
  });

  model.sync();

  return model;
};

