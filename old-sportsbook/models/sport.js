var sequelize = require('sequelize');

module.exports.generateModel = function(sequelizeConnection) {
  var model = sequelizeConnection.define('Sport', {
    id: {
      type: sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {type: sequelize.STRING, unique: true},
    slug: {type: sequelize.STRING, unique: true}
  });

  model.sync();

  return model;
};

