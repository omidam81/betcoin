var async = require('async');
var http = require("http");
var libxmljs = require("libxmljs");
var moment = require('moment');
var Sequelize = require('sequelize-postgres').sequelize;
var postgres  = require('sequelize-postgres').postgres;
var slug = require('slug');
var config = require('../config.json')

var sequelize = new Sequelize(config.database, config.username, config.password, {
  host: '127.0.0.1',
  port: '5432',
  dialect: 'postgres',
  omitNull: true,
  define: {
    underscored: false,
    syncOnAssociation: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    timestamps: true
  }
});

var App = {};
