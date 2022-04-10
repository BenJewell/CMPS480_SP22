//server.js: initializes routes, runs Express app.
//see https://www.bezkoder.com/node-js-upload-excel-file-database/
//Ask madie about any questions!

const express = require("express");
const app = express();
const db = require("./models");
const initRoutes = require("./routes/tutorial.routes");
global.__basedir = __dirname + "/..";
app.use(express.urlencoded({ extended: true }));
initRoutes(app);
db.sequelize.sync();
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });
let port = 8080;
app.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});
