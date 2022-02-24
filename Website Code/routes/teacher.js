const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");

router.get('/courses', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select * from Sections, Courses where instructor_id = ? and Courses.course_id = Sections.course_id", [res.locals.userId], d => {
    return res.send(d);
  });
});

router.get('/course/:id', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select * from Sections, Courses where instructor_id = ? and Sections.course_id = ? and Courses.course_id = Sections.course_id", [res.locals.userId, req.params.id], section => {
    query("select Section_Registrations.*, Users.id, Users.first_name, Users.last_name from Section_Registrations, Users where section_id = ? and Users.id = section_registrations.student_id", [section[0]["section_id"]], d => {
      return res.send({...section[0], students: d});
    });
  });
});

router.get('/student/:studentId/:courseId', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select * from Grades, Assignments where Assignments.dection_id = 1 and Grades.assignment_id = Assignments.assignment_id;", [req.params.studentId, req.params.courseId], grades => {
    query("select Users.user_id, Users.first_name, Users.last_name from Users where Users.id = ?", [req.params.studentId], student => {
      return res.send({grades: grades, student: student[0]});
    });
  });
});

module.exports = router;
