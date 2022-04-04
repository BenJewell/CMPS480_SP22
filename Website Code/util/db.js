const mysql = require("mysql");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: '167.88.242.60',
  user: 'goodgrades',
  password: 'goodgrades',
  database: 'goodgrades',
  debug: false
});

function log_action(performer, action_type, action_target, action_table) {
  query("insert into Actions_Log values (null, ?, Now(), ?, ?, ?)", [
    performer,
    action_type,
    action_target,
    action_table
  ], (data, error) => {
    console.log(error);
    if (error) {
      console.log(error)
    }
  });
}

function query(stmt, params, cb) {
  pool.getConnection(function (err, cnx) {
    if (err) {
      console.error('Error connecting to MySQL server', err);
      return cb(false, err);
    } else {
      cnx.query(stmt, params, function (error, rows) {
        try {
          cnx.release();
        } catch (e) {
          console.error("Error releasing connection");
          return cb(false, error);
        }

        if (error) {
          console.error('Could not execute SQL query', error);
          return cb(false, error);
        }

        return cb(rows);
      });
    }
  });
}

module.exports = {query, log_action};
