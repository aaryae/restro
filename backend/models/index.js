"use strict";
const fs = require("fs");
const _ = require("lodash");
const path = require("path");

const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

const config = require(__dirname + "/../configs/db-config.js")[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  console.log("====================================");
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  console.log("=--------------------------------------");
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes,
    );
    let name = _.camelCase(model.name) + "Model";
    db[name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

console.log("<<<--------- Database Models ----------->>>", db);
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
