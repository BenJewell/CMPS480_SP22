//models/tutorial.model.js for Sequelize Tutorial data model.
//see https://www.bezkoder.com/node-js-upload-excel-file-database/
//Ask madie about any questions!

export default (sequelize, Sequelize) => {
    const Tutorial = sequelize.define("tutorial", {  //"tutorial" refers to the "tutorials" table in the MySQL db in the example. this will change to "goodgrades"
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
    return Tutorial; //consider renaming "Tutorial"
  };