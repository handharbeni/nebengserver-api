'use strict';
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../../config/config_admin');
var con = mysql.createConnection({
  // host: "119.82.225.195",
  // user: "admin_default",
  // password: "beni123",
  // database: "admin_default"
  host: "localhost",
  user: "root",
  password: "beni123",
  database: "db_nebengserver"
});
con.connect(function(err) {
	if (err) throw err
});
exports.register = function(req, res){
	var hashedPassword = bcrypt.hashSync(req.body.password, 8);
	var sQuery = "SELECT * FROM m_administrator WHERE username=?";
	var sValues = [req.body.username];
	con.query(sQuery, sValues, function(err, result, fields){
		if (err) throw err

		if (result.length < 1) {
			var iQuery = "INSERT INTO m_administrator "+
				"(nama, username, password, email, privileges, is_login)"+
				"VALUES"+
				"(?,?,?,?,?,?)";
			var iValues = [req.body.name, req.body.username, hashedPassword, req.body.email, "{}", "0"];
			con.query(iQuery, iValues, function(err, result, fields){
					if (err) return res.json(err);

					con.query("SELECT * FROM m_administrator WHERE username = '"+req.body.username+"'", function(err, result, fields){
						var idUser = result[0].id_user;
						var token = jwt.sign({ id: idUser }, config.secret, {expiresIn: 86400});
						res.json({ auth: true, token: token });
					});
			});
		}else{
			res.json({'result':'already registered'});
		}
	});
}
exports.login = function(req, res) {
	var sQuery = "SELECT * FROM m_administrator WHERE username=?";
	var sValues = [req.body.username];
	con.query(sQuery, sValues, function(err, result, fields){
		if (err) throw err

		if (result.length > 0) {
			var passwordUser = result[0].password;
			var idUser = result[0].id_user;
			var passwordIsValid = bcrypt.compareSync(req.body.password, passwordUser);
			if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
		
			var token = jwt.sign({ id: idUser }, config.secret, {expiresIn: 86400});
			res.json({ auth: true, token: token });
		}else{
			res.json({'result':'login failed'});
		}
	});
}
exports.list_order = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded){
		if (err) return res.status(500).send({ auth: false, message: 'You Don\'t Have Privileges Here.' });
		var id  = decoded.id;
		var sQuery = "SELECT * FROM m_order";
		con.query(sQuery, function(err, results, fields){
			if (err) throw err
			if (results.length > 0) {
				res.status(200).send({ results });
			}else{
				res.status(204).send({ message: 'No Data To Displayed' });
			}
		});
	});
}
exports.list_payments = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded){
		if (err) return res.status(500).send({ auth: false, message: 'You Don\'t Have Privileges Here.' });
		var id  = decoded.id;
		var sQuery = "SELECT * FROM t_payment WHERE verifikasi=0";
		con.query(sQuery, function(err, results, fields){
			if (err) throw err
			if (results.length > 0) {
				res.status(200).send({ results });
			}else{
				res.status(204).send({ message: 'No Data To Displayed' });
			}
		});
	});
}
exports.verified_payments = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded){
		if (err) return res.status(500).send({ auth: false, message: 'You Don\'t Have Privileges Here.' });
		var id  = decoded.id;
		var id_payments = req.body.id_payments;
		var sQuery = "UPDATE t_payment SET "+
						"verifikasi=? "+
						"WHERE id_payment=?";
		var sValues = [1, id_payments];
		con.query(sQuery, sValues, function(err, results, fields){
			if (err) throw err

			res.status(200).send({ message: 'Success' });
			// if (results.length > 0) {
			// }else{
			// 	res.status(204).send({ message: 'Failed' });
			// }
		});
	});
}
	// var token = req.headers['nebeng-token'];
	// if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	// jwt.verify(token, config.secret, function(err, decoded){
	// 	if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
	// 	var id  = decoded.id;

	// });
