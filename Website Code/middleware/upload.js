//middleware/upload.js: initializes Multer Storage engine and defines middleware function to save Excel file in uploads folder.
//see https://www.bezkoder.com/node-js-upload-excel-file-database/
//Ask madie about any questions!

const multer = require("multer");
const excelFilter = (req, file, cb) => {
  if (
    file.mimetype.includes("excel") ||
    file.mimetype.includes("spreadsheetml")
  ) {
    cb(null, true);
  } else {
    cb("Please upload only excel file.", false);
  }
};
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/resources/static/assets/uploads/"); //"/resources/static/assets/uploads/" likely to become "Excel/GoodGradesCreateUser.xlsx"
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, `${Date.now()}-bezkoder-${file.originalname}`); //bezkoder to admin/role
  },
});
var uploadFile = multer({ storage: storage, fileFilter: excelFilter });
module.exports = uploadFile;
