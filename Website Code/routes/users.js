const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const validate = require('express-jsonschema').validate;

const LoginSchema = {
  type: 'object',
  properties: {
    email: {
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

router.post('/login', validate({body: LoginSchema}), function (req, res, next) {
  query("select `ID` as `id`, `NAME` as `name`, `User Role` as `role`, sha1(concat(now(), `ID`, `NAME`)) as `key` from `USERS` where `Email Address` = ? and `password` = SHA1(?)", [
    req.body.email,
    req.body.password
  ], data => {
    if (!data || !data.length) {
      return res.send({success: false});
    }
    query("update `USERS` set `sessionKey` = ? where `ID` = ?", [data[0].key, data[0].id], () => {
    });
    return res.send({success: true, ...data[0]});
  });
});

const SignUpSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
    },
    email: {
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
 step 3: select user to get their info and key to log them in on the frontend
 */
router.post('/signup', validate({body: SignUpSchema}), function (req, res, next) {
  // step 1
  query("select `id` from `USERS` where `Email Address` = ?", [
    req.body.email,
  ], data => {
    if (data.length !== 0) {
      // account with email already exists
      return res.send({success: false, error: "Account already exists"});
    }
    let name = req.body.name.split(" ");
    // step 2
    query("insert into `USERS` values (null, ?, ?, null, ?, 'student', sha1(?), sha1(concat(now(), `ID`, `NAME`)))",
        [
          name[0],
          name[1],
          req.body.email,
          req.body.password
        ],
        (data) => {
          // step 3
          query("select `ID` as `id`, `NAME` as `name`, `User Role` as `role`, sha1(concat(now(), `ID`, `NAME`)) as `key` from `USERS` where `ID` = ?", [
            data.insertId
          ], data => {
            if (!data || !data.length) {
              return res.send({success: false});
            }
            return res.send({success: true, ...data[0]});
          });
        });
  });
});

module.exports = router;
