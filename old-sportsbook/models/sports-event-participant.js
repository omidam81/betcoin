var sequelize = require('sequelize');

module.exports.generateModel = function(sequelizeConnection) {
  var model = sequelizeConnection.define('SportsEventParticipant', {
    id: {
      type: sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    event_id: sequelize.INTEGER,
    participant_id: sequelize.INTEGER,
    visiting_home_draw: sequelize.STRING
  });

  model.sync();
    
  return model;
};

