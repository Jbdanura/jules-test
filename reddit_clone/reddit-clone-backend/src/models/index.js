'use strict';

// Ensure dotenv is loaded at the very top.
// This allows ../config/config.js to access process.env variables when it's required.
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Require the config.js file, which now exports a JS object with env vars already processed
const config = require(__dirname + '/../config/config.js')[env]; // Changed to config.js

const db = {};
let sequelize;

if (config.use_env_variable) { // For production, using DATABASE_URL
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else { // For development and test, using individual parameters from config.js
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config // config object already has port as an integer and other values resolved
  );
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
