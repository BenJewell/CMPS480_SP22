//db.config.js exports configuring parameters for MySQL connection & Sequelize.
//see https://www.bezkoder.com/node-js-upload-excel-file-database/
//Ask madie about any questions!

module.exports = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "123456",
    DB: "testdb",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };