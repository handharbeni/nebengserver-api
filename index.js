var mysql = require('mysql');

var con = mysql.createConnection({
  host: "nebengserver.com",
  user: "admin_default",
  password: "beni123"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
