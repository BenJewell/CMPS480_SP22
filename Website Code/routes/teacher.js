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
  // It seems res.locals.userId is the user ID that is in use, and req.params.id is the course ID we are getting the student list for. Having trouble reverse enginering this part.
  console.log("user id: " + res.locals.userId);
  console.log('id: '  + req.params.id);

  if (req.params.id == false || res.locals.userId == false) {
    // Prevents hard crash if user ID or course ID requested do not exist.
    return res.status(500).send("Invalid User or Course ID!") // Can't this this text to appear on the front end, but not a big deal.
  }

  query("select * from Sections, Courses where instructor_id = ? and Sections.course_id = ? and Courses.course_id = Sections.course_id", [res.locals.userId, req.params.id], section => {
    query("select Section_Registrations.*, Users.user_id, Users.first_name, Users.last_name, (SUM(Grades.points_received)/SUM(Assignments.points_possible)) AS total_grade from Section_Registrations, Users, Assignments, Grades where Assignments.section_id = ? and Section_Registrations.student_id = Grades.student_id and Users.user_id = Section_Registrations.student_id and Assignments.assignment_id = Grades.assignment_id and Grades.points_received IS NOT NULL;", 
    [section[0]["section_id"]], d => {
      return res.send({...section[0], students: d});
    });
  });
});

router.get('/student/:studentId/:courseId', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select * from Grades, Assignments where Assignments.section_id = ? and Grades.student_id = ? and Grades.assignment_id = Assignments.assignment_id;", [req.params.courseId, req.params.studentId], grades => {
    query("select Users.user_id, Users.first_name, Users.last_name from Users where Users.user_id = ?", [req.params.studentId], student => {
      return res.send({...student[0], grades: grades});
    });
  });
});

router.get('/assignments/:id', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select Assignments.assignment_id, Assignments.name, Assignments.description, Grades.points_received from Assignments, Grades where Grades.assignment_id = Assignments.assignment_id and course_id = ?;", [req.params.id], assignments => {
    return res.send(assignments);
  });
});

module.exports = router;
