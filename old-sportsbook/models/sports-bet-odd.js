var sequelize = require('sequelize');

module.exports.generateModel = function(sequelizeConnection) {
  var model = sequelizeConnection.define('SportsBetOdd', {
    id: {
      type: sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    event_id: sequelize.INTEGER,
    type: sequelize.STRING, //@TODO enum ("moneyline", "spread", "total")
    favor: sequelize.INTEGER,
    payout: sequelize.DECIMAL(15,8),
    spread: sequelize.DECIMAL(15,8),
    total_points: sequelize.DECIMAL(15,8),
    total_side: sequelize.STRING,
    expired_at: sequelize.DATE,
    participant_id: sequelize.INTEGER
  });

  model.sync();

  return model;
};

