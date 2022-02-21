const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");

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
}); //side nav

router.get('/course/:id', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("select * from Sections, Courses where instructor_id = ? and Sections.`Course ID` = ? and Courses.`Course ID` = Sections.`Course ID`", [res.locals.userId, req.params.id], section => {
    query("select `Section Registrations`.*, `USERS`.ID, USERS.NAME, USERS.LASTNAME from `Section Registrations`, USERS where `Section ID` = ? and USERS.`ID` = `Section Registrations`.`ID`", [section[0]["Section ID"]], d => {
      return res.send({...section[0], students: d});
    });
  });
}); //nav links

router.get('/student/:studentId/:courseId', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("select * from Grades, Assignments where Assignments.`Section ID` = 1 and Grades.`Assignment ID` = `Assignments`.`Assignment ID`;", [req.params.studentId, req.params.courseId], grades => {
    query("select USERS.ID, USERS.NAME, USERS.LASTNAME from USERS where USERS.ID = ?", [req.params.studentId], student => {
      return res.send({grades: grades, student: student[0]});
    });
  });
});

module.exports = router;