//excel.controllers.js: use read-excel-file to read Excel file in uploads folder, then save data to 
//MySQL database with Sequelize Model. export functions for retrieving all tutorials in database table
//see https://www.bezkoder.com/node-js-upload-excel-file-database/
//Ask madie about any questions!

const db = require("/models");
const Tutorial = db.tutorials; //double check if you renamed tutorials
const readXlsxFile = require("read-excel-file/node");
//upload function
//check file upload from req.file 
//then uses read-excel-file to read excel file in uploads folder
//the data which is returned as rows will be changed to tutorials array.
const upload = async (req, res) => {
  try {
    if (req.file == undefined) { 
      return res.status(400).send("Please upload an excel file!");
    }
    let path =
      __basedir + "/resources/static/assets/uploads/" + req.file.filename; //"/resources/static/assets/uploads/" likely to become "Excel/GoodGradesCreateUser.xlsx"
    readXlsxFile(path).then((rows) => {
      // skip header
      rows.shift();
      let tutorials = [];
      rows.forEach((row) => {
        let tutorial = {
          id: row[0],
          title: row[1],
          description: row[2],
          published: row[3],
        };
        tutorials.push(tutorial);
      });
      Tutorial.bulkCreate(tutorials) //use sequelize model bulkCreate() method to save the tutorials array (first name, last name, email address, password, role) to MySQL db.
        .then(() => {
          res.status(200).send({
            message: "Uploaded the file successfully: " + req.file.originalname,
          });
        })
        .catch((error) => {
          res.status(500).send({
            message: "Fail to import data into database!",
            error: error.message,
          });
        });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
};

//The getTutorials() function uses findAll() method to return all Tutorials stored in the database tutorials table.
const getTutorials = (req, res) => {
  Tutorial.findAll()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials.",
      });
    });
};
module.exports = {
  upload,
  getTutorials,
};
