var moment = require('moment');
var sequelize = require('sequelize');

module.exports.generateModel = function(sequelizeConnection) {
  var model = sequelizeConnection.define('SportsBet', {
    id: {
      type: sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    address: sequelize.STRING,
    event_id: sequelize.INTEGER,
    bet_odd_id: sequelize.INTEGER,
    bet: sequelize.DECIMAL(15,8),
    payout: sequelize.DECIMAL(15,8),
    status: sequelize.STRING //sequelize.ENUM("open", "win", "loss", "push", "cancelled")
  }, {
    instanceMethods: {
      createdAt_utc: function() { return moment(this.createdAt).utc().format(); },
      createdAt_str: function() { return moment(this.createdAt).utc().fromNow(); }
    }
  });

  model.sync();

  return model;
};

