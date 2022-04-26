const express = require('express');
const {query, log_action} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");
const validate = require('express-jsonschema').validate;

// more complex and/or long queries
// stored here for readability
const STUDENT_GET_SECTIONS_QUERY = `
    select s.section_id,
           s.*,
           concat(u.first_name, ' ', u.last_name) as instructor_name
    from Sections s,
         Section_Registrations sr,
         Users u
    where sr.student_id = ?
      and u.user_id = s.instructor_id
      and s.section_id = sr.section_id
`;
const STUDENT_GET_GRADES_QUERY = `
    select Courses.course_id,
           Courses.name                                                     as course_name,
           Courses.primary_code,
           Courses.secondary_code,
           (sum(Grades.points_received) / sum(Assignments.points_possible)) as total_grade
    from Assignments,
         Grades,
         Courses
    where student_id = ?
      and Assignments.assignment_id = Grades.assignment_id
      and Courses.course_id = Assignments.course_id
      and Grades.points_received is not null
      and Grades.active = 1
    group by Courses.course_id
`;


// For actions log
router.get('/actions', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Users.first_name, Users.last_name, Actions_Log.*, DATE_FORMAT(Actions_Log.date, '%m/%d/%y %h:%i %p') AS formatted_date from Actions_Log, Users WHERE Actions_Log.user_id = Users.user_id;", [], d => {
    return res.send(d);
  });
});
// End actions log


router.get('/courses', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Courses.*, Sections.*, CONCAT(Users.first_name, ' ', Users.last_name) as `instructor` from Courses, Sections, Users where Courses.course_id = Sections.course_id and Users.user_id = Sections.instructor_id", [], d => {
    return res.send({data: d});
  });
});

router.get('/users', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select `user_id`, `first_name`, `last_name`, `email_address`, `role` from Users", [], d => {
    let results = [];
    for (let data of d) {
      results.push(Object.values(data));
    }
    return res.send({data: results});
  });
});

router.get('/section/:id', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Sections.*, CONCAT(Users.first_name, ' ', Users.last_name) as `instructor` from Sections, Users where section_id = ? and Users.user_id = Sections.instructor_id", [req.params.id], section => {
    if (!section.length) {
      return res.send({success: false});
    }
    query("select * from Courses where course_id = ?", [section[0].course_id], course => {
      if (!course.length) {
        return res.send({success: false});
      }
      return res.send({
        section: section[0],
        course: course[0]
      });
    });
  });
});

router.get('/section/:id/students', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Section_Registrations.*, Users.first_name, Users.last_name, Users.email_address from Section_Registrations, Users where section_id = ? and Users.user_id = Section_Registrations.student_id", [req.params.id], students => {
    if (!students.length) {
      return res.send({data: []});
    }
    return res.send({data: students})
  });
});


const RegisterStudentSchema = {
  type: 'object',
  properties: {
    student_id: {
      type: 'number',
      required: true,
    }
  }
};
router.post('/section/:id/students', auth.verifySessionAndRole("admin"), validate({body: RegisterStudentSchema}), function (req, res, next) {
  query("insert into Section_Registrations values (?, ?)", [
    req.params.id,
    req.body.student_id,
  ], (data, error) => {
    if (!data && error.code === "ER_DUP_ENTRY") {
      return res.send({success: false, message: "Student is already enrolled in course section."})
    }
    log_action(res.locals.userId, `added student id ${req.body.student_id} to`, req.params.id, "Section_Registrations")
    return res.send({success: true});
  });
});

router.delete('/section/:id/students/:studentId', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("delete from Section_Registrations where section_id = ? and student_id = ?", [
    req.params.id,
    req.params.studentId,
  ], _ => {
  });
  log_action(res.locals.userId, `removed student id ${req.body.student_id} from`, req.params.id, "Section_Registrations")
  return res.send({success: true});
});


const CourseUpdateSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
    primary_code: {
      type: 'string',
      required: true,
    },
    secondary_code: {
      type: 'string',
      required: true,
    }
  }
};
router.put('/course/:id', auth.verifySessionAndRole("admin"), validate({body: CourseUpdateSchema}), function (req, res, next) {
  query("update Courses set name = ?, description = ?, primary_code = ?, secondary_code = ? where course_id = ?", [
    req.body.name,
    req.body.description,
    req.body.primary_code,
    req.body.secondary_code,
    req.params.id,
  ], (data, error) => {
    log_action(res.locals.userId, `modified course id ${req.body.course_id}`, req.params.id, "Courses")
    return res.send({success: true});
  });
});

const SectionUpdateSchema = {
  type: 'object',
  properties: {
    instructor_id: {
      type: 'number',
      required: true,
    },
    section_code: {
      type: 'string',
      required: true,
    },
  }
};
router.put('/section/:id', auth.verifySessionAndRole("admin"), validate({body: SectionUpdateSchema}), function (req, res, next) {
  query("update Sections set instructor_id = ?, section_code = ? where section_id = ?", [
    req.body.instructor_id,
    req.body.section_code,
    req.params.id,
  ], (data, error) => {
    log_action(res.locals.userId, `section id ${req.body.section_id} to`, req.params.id, "Sections")
    return res.send({success: true});
  });
});

router.get('/search/:role', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Users.user_id as `id`, CONCAT(Users.first_name, ' ', Users.last_name) as `text` from Users where role = ? and (concat(`first_name`, ' ', `last_name`) like ? or `email_address` like ? or user_id = ?)", [req.params.role, `%${req.query.q}%`, `%${req.query.q}%`, req.query.q], users => {
    return res.send({items: users})
  });
});

router.get('/user/:id', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select `user_id`, `first_name`, `last_name`, `email_address`, `role` from Users where user_id = ?", [req.params.id], d => {
    if (!d.length) {
      return res.send({success: false, message: "User not found"});
    }
    let user = d[0];

    // if user is a student, fetch their sections + grades
    if (user.role === "student") {
      query(STUDENT_GET_SECTIONS_QUERY, [req.params.id], sections => {
        query(STUDENT_GET_GRADES_QUERY, [req.params.id], grades => {
          let courses = {};
          sections.map((data) => courses[data.course_id] = data);

          for (let grade of grades)
              // skip if no longer enrolled in this course
            if (courses[grade.course_id] !== undefined)
              courses[grade.course_id] = {...courses[grade.course_id], ...grade};

          return res.send({...user, courses: Object.values(courses)});
        });
      });
    } else
      return res.send(user);
  });
});

const UserSchema = {
  type: 'object',
  properties: {
    email_address: {
      type: 'string',
      required: true,
      format: 'email',
    },
    first_name: {
      type: 'string',
      required: true
    },
    last_name: {
      type: 'string',
      required: true
    },
    role: {
      type: 'string',
      required: true
    }
  }
};
router.put('/user/:id', auth.verifySessionAndRole("admin"), validate({body: UserSchema}), function (req, res, next) {
  query("update Users set first_name = ?, last_name = ?, role = ?, email_address = ? where user_id = ?", [
    req.body.first_name,
    req.body.last_name,
    req.body.role,
    req.body.email_address,
    req.params.id,
  ], d => {
    log_action(res.locals.userId, `modified user id ${req.body.userId}`, req.params.id, "Users")
    return res.send({success: true});
  });
});

const SignUpSchema = {
  type: 'object',
  properties: {
    first_name: {
      type: 'string',
      required: true,
    },
    last_name: {
      type: 'string',
      required: true,
    },
    role: {
      type: 'string',
      required: true,
    },
    email_address: {
      type: 'string',
      required: true,
      format: 'email',
    },
    password: {
      type: 'string',
      required: true
    }
  }
};

/*
 /signup
 step 1: check for existing user under that email address
 step 2: insert user into users table
 */
router.post('/users', validate({body: SignUpSchema}), function (req, res, next) {
  // step 1
  query("select user_id from Users where email_address = ?", [
    req.body.email_address,
  ], data => {
    if (data.length !== 0) {
      // account with email already exists
      return res.send({success: false, message: "Account already exists with this email address"});
    }
    // step 2
    query("insert into Users values (null, ?, ?, null, ?, ?, sha1(?), sha1(concat(now(), user_id, first_name, null)))",
        [
          req.body.first_name,
          req.body.last_name,
          req.body.email_address,
          req.body.role,
          req.body.password
        ],
        (data) => {
          log_action(res.locals.userId, `created user id ${req.body.student_id}`, req.params.user_id, "Section_Registrations")
          return res.send({success: true, id: data.insertId})
        });
  });
});


router.post("/users/import", auth.verifySessionAndRole("admin"), function (req, res) {
  for (let user of req.body.users) {
    query("insert into Users (user_id, first_name, last_name, email_address, role, password, session_key) values (null, ?, ?, ?, ?, sha1(?), sha1(concat(now(), user_id, first_name)))",
        [
          user.first_name,
          user.last_name,
          user.email_address,
          user.role,
          user.password
        ],
        _ => {
        });
  }
  return res.send({success: true});
});


module.exports = router;
