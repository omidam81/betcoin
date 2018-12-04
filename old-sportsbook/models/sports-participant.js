var sequelize = require('sequelize');
module.exports.generateModel = function(sequelizeConnection) {

  var model = sequelizeConnection.define('SportsParticipant', {
    id: {
      type: sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: sequelize.STRING,
    pinnacle_contestantnum: sequelize.INTEGER,
    pinnacle_gamenumber: sequelize.INTEGER
  });

  model.sync();

  return model;
};

