const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");

router.get('/courses', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select * from Courses, Sections where Courses.course_id = Sections.course_id", [], d => {
    let results = [];
    for (let data of d) {
      results.push(Object.values(data));
    }
    return res.send({data: results});
  });
});

module.exports = router;
