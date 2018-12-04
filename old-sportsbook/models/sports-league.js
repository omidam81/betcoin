var sequelize = require('sequelize');

module.exports.generateModel = function(sequelizeConnection) {
  var model = sequelizeConnection.define('SportsLeague', {
    id: {
      type: sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    sport_id: sequelize.INTEGER,
    name: {type: sequelize.STRING, unique: true},
    slug: {type: sequelize.STRING, unique: true}
  });

  model.sync();

  return model;
};

