//models/tutorial.model.js for Sequelize Tutorial data model.
//see https://www.bezkoder.com/node-js-upload-excel-file-database/
//Ask madie about any questions!

module.exports = (sequelize, Sequelize) => {
    const Tutorial = sequelize.define("tutorial", {
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      published: {
        type: Sequelize.BOOLEAN
      }
    });
    return Tutorial;
  };