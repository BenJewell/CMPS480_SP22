//routes/tutorial.routes.js: defines routes for endpoints that is called from HTTP Client, 
//use controllers (along with middleware) to handle requests.
//see https://www.bezkoder.com/node-js-upload-excel-file-database/
//Ask madie about any questions!


//look into changing file name when you change tutorial name
const express = require("express");
const router = express.Router();
const excelController = require("../controllers/tutorials/excel.controller");//using controller 
const upload = require("../middleware/upload"); //using middlewear upload
let routes = (app) => {
  router.post("/upload", upload.single("file"), excelController.upload);
  router.get("/tutorials", excelController.getTutorials);
  app.use("/api/excel", router);
};
module.exports = routes;
