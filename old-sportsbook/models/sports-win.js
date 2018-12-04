var sequelize = require('sequelize');

module.exports.generateModel = function(sequelizeConnection) {
    var model = sequelizeConnection.define('SportsWin', {
        id: {
            type: sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        amount: { type: sequelize.DECIMAL(15,8) },
        currency: { type: sequelize.ENUM("BTC") },
        sport_id: { type: sequelize.INTEGER },
        league_id: { type: sequelize.INTEGER },
        user_name: { type: sequelize.STRING },
        won_at: { type: sequelize.DATE }
    });

    model.sync();

    return model;
};

