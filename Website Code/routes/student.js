const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");

router.get('/courses', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("select section_id from Section_Registrations where id = ?", [res.locals.userId], d => {
    let results = [];
    for (let data of d) {
      results.push(Object.values(data));
    }
    query("select * from Sections, Courses where section_id in ? and Courses.course_id = Sections.course_id", [results], d => {
      return res.send(d);
    });
  });
}); //side nav

router.get('/course/:id', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("select * from Sections, Courses where instructor_id = ? and Sections.course_id = ? and Courses.course_id = Sections.course_id", [res.locals.userId, req.params.id], section => {
    query("select Section_Registrations.*, Users.id, users.first_name, users.last_name from Section Registrations, users where section_id = ? and users.id = Section_Registrations.id", [section[0]["section_id"]], d => {
      return res.send({...section[0], students: d});
    });
  });
}); //nav links

router.get('/student/:studentId/:courseId', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("select * from Grades, Assignments where Assignments.section_id = 1 and Grades.assignment_id = Assignments.assignment_id;", [req.params.studentId, req.params.courseId], grades => {
    query("select Users.id, Users.first_name, Users.last_name from Users where Users.id = ?", [req.params.studentId], student => {
      return res.send({grades: grades, student: student[0]});
    });
  });
});

module.exports = router;