var sequelize = require('sequelize');

module.exports.generateModel = function(sequelizeConnection) {
  var model = sequelizeConnection.define('PinnacleOddsUpdate', {
    id: {
      type: sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    pinnacle_feed_time: sequelize.STRING
  });

  model.sync();

  return model;
};

