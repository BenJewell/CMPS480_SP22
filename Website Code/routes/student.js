const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");

//Side Nav
router.get('/courses', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("select `Section ID` from `Section Registrations` where ID = ?", [res.locals.userId], d => {
    let results = [];
    for (let data of d) {
      results.push(Object.values(data));
    }
    query("select * from Sections, Courses where `Section ID` in ? and Courses.`Course ID` = Sections.`Course ID`", [results], d => {
      return res.send(d);
    });
  });
});

//Course Grades Table
router.get('/grades/:id', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT Assignments.`Assignment Name`, Grades.points_received, Assignments.points_possible, Assignments.Date, Grades.missing FROM Assignments, Grades WHERE Assignments.`Assignment ID` = Grades.`Assignment ID` AND Assignments.`Section ID` = ? AND Grades.student_id = ?", [req.params.id, res.locals.userId], d => {
    return res.send(d);
  });
});

//Overview Table
router.get('/dashboard/overview', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT Courses.`Course ID`, Courses.name, Grades.points_received, Assignments.points_possible FROM Assignments, Grades, Courses WHERE student_id = ? AND Assignments.`Assignment ID` = Grades.`Assignment ID` AND Courses.`Course ID` = Assignments.`Course ID`;", [res.locals.userId], d => {
    return res.send(d);
  });
});
//Recent Table
router.get('/dashboard/recent', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT Courses.`Course ID`, Courses.name, Assignments.`Assignment Name`, Grades.points_received, Assignments.points_possible, Assignments.Date FROM Assignments, Grades, Courses WHERE student_id = ? AND Assignments.`Assignment ID` = Grades.`Assignment ID` AND Courses.`Course ID` = Assignments.`Course ID` ORDER BY Date DESC LIMIT 5;", [res.locals.userId], d => {
    return res.send(d);
  });
});
//Missing Table
router.get('/dashboard/missing', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT Courses.`Course ID`, Courses.name, Assignments.`Assignment Name`, Grades.missing FROM Assignments, Grades, Courses WHERE student_id = ? AND Assignments.`Assignment ID` = Grades.`Assignment ID` AND Courses.`Course ID` = Assignments.`Course ID` AND Grades.missing = 1;", [res.locals.userId], d => {
    return res.send(d);
  });
});

module.exports = router;