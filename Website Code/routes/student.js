const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");
const validate = require('express-jsonschema').validate;


//Side Nav
router.get('/courses', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT section_id FROM Section_Registrations WHERE student_id = ?", [res.locals.userId], d => {
    let results = [];
    for (let data of d) {
      results.push(Object.values(data));
    }
    query("SELECT * FROM Sections, Courses WHERE section_id IN ? AND Courses.course_id = Sections.course_id ORDER BY Courses.name", [results], d => {
      return res.send(d);
    });
  });
});

//Course Grades Table
router.get('/grades/:id', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Grades.grades_id, Assignments.assignment_category, Assignments.name, Grades.points_received, Assignments.points_possible, DATE_FORMAT(Assignments.due_date, '%m/%d/%y %h:%i %p') AS due_date, Grades.missing, Grades.instructor_notes, Grades.flagged_for_audit FROM Assignments, Grades WHERE Assignments.assignment_id = Grades.assignment_id AND Assignments.section_id = ? AND Grades.student_id = ? ORDER BY assignment_category, due_date DESC, name;`, [req.params.id, res.locals.userId], table => {
    query("SELECT (SUM(Grades.points_received)/SUM(Assignments.points_possible)) AS total_grade FROM Assignments, Grades WHERE Assignments.assignment_id = Grades.assignment_id AND Assignments.section_id = ? AND Grades.student_id = ? AND Grades.points_received IS NOT NULL", [req.params.id, res.locals.userId], totalGrade => {
      query("SELECT Courses.name FROM Courses WHERE course_id = ?", [req.params.id, res.locals.userId], name => {
        query("SELECT Users.first_name, Users.last_name, Users.email_address, Users.phone_number FROM Sections, Users WHERE course_id = ? AND Sections.instructor_id = Users.user_id;", [req.params.id], teacher => {
          return res.send({...totalGrade[0], table: table, name: name[0], teacher: teacher});
        });
      });
    });
  });
});

//Overview Table
router.get('/dashboard/overview', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, (SUM(Grades.points_received)/SUM(Assignments.points_possible)) AS total_grade 
            FROM Assignments, Grades, Sections, Courses 
            WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Sections.section_id = Assignments.section_id 
            AND Sections.course_id = Courses.course_id AND Grades.points_received IS NOT NULL 
            ORDER BY course_name;`, [res.locals.userId], d => {
    return res.send(d);
  });
});
//Recent Table
router.get('/dashboard/recent', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name, Grades.points_received, Assignments.points_possible 
            FROM Assignments, Grades, Sections, Courses 
            WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Sections.section_id = Assignments.section_id 
            AND Courses.course_id = Sections.course_id AND Grades.date_graded > (now() - interval 1 week) 
            ORDER BY Grades.date_graded DESC;`, [res.locals.userId], d => {
    return res.send(d);
  });
});
//Missing Table
router.get('/dashboard/missing', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name 
            FROM Assignments, Grades, Sections, Courses 
            WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Sections.section_id = Assignments.section_id 
            AND Courses.course_id = Sections.course_id AND Grades.missing = 1 
            ORDER BY Assignments.due_date DESC;`, [res.locals.userId], d => {
    return res.send(d);
  });
});
//Upcoming Table
router.get('/dashboard/upcoming', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name, Assignments.due_date 
            FROM Assignments, Grades, Sections, Courses 
            WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Sections.section_id = Assignments.section_id 
            AND Courses.course_id = Sections.course_id AND Grades.active = 1 AND Assignments.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
            ORDER BY Assignments.due_date DESC;
  `, [res.locals.userId], d => {
    return res.send(d);
  });
});
//Assignment Calendar
router.get('/calendar', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name, DATE_FORMAT(Assignments.due_date, '%m/%d/%y') as due_date, DATE_FORMAT(Assignments.due_date, '%h:%i %p') as due_time 
          FROM Assignments, Sections, Courses, Section_Registrations
          WHERE student_id = ?
          AND Sections.section_id = Assignments.section_id = Section_Registrations.section_id
          AND Courses.course_id = Sections.course_id 
          AND Assignments.due_date > now() 
          ORDER BY Assignments.due_date
  `, [res.locals.userId], table => {
    query("SELECT Courses.course_id, name AS course_name FROM Sections, Courses, Section_Registrations WHERE student_id = ? AND Sections.section_id = Section_Registrations.section_id AND Courses.course_id = Sections.course_id ", [res.locals.userId], courses => {
      return res.send({courses: courses, table: table});
    });
  });
});

//Flagged for audit
const auditSchema = {
  type: 'object',
  properties: {
    flagged_for_audit: {
      type: 'integer',
      required: true
    },
    grades_id: {
      type: 'integer',
      required: true
    }
  }
};
router.post('/audit', validate({ body: auditSchema }), function (req, res, next) {
  query("UPDATE Grades SET flagged_for_audit = ? WHERE grades_id = ? AND student_id = ?;",
    [
      req.body.flagged_for_audit,
      req.body.grades_id,
      res.locals.userId
    ],
    (data) => {
      return res.send({ success: true });
    });
});


module.exports = router;