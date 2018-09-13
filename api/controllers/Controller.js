'use strict';
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../../config/config');
var mysql_config = require('../../config/mysql_config');
var con = mysql.createConnection(mysql_config);
// con.connect(function(err) {
// 	if (err) throw err
// });

function handleDisconnect() {
  con = mysql.createConnection(mysql_config);
  con.connect(function(err) {
    if(err) {
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000);
    }
  });
  con.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

exports.list_all_packages = function(req, res) {
	var sQuery = "select id_paket, nama_paket, harga, nama_type FROM m_paket LEFT JOIN m_typelayanan ON m_paket.id_type = m_typelayanan.id_type";
	con.query(sQuery,  function (err, results, fields){
		if (err) throw err
		if (results.length > 0) {
			res.json({results});
		}else{
			res.status(500).send({'results':'empty'});
		}
	});
};
exports.list_all_themes = function(req,res){
	var sQuery = "SELECT * FROM m_tema";
	con.query(sQuery, function(err, results, fields){
		if (err) throw err
		if (results.length > 0) {
			res.json({results});
		}else{
			res.status(500).send({'results':'empty'});
		}
	});
};
exports.list_all_packages_by_type = function(req, res) {
	var sQuery = "select id_paket, nama_paket, harga, nama_type FROM m_paket LEFT JOIN m_typelayanan ON m_paket.id_type = m_typelayanan.id_type WHERE m_typelayanan.id_type = ?";
	var sValues = [req.params.packageType];
	con.query(sQuery, sValues,  function (err, results, fields){
		if (err) throw err
		if (results.length > 0) {
			res.json({results});
		}else{
			res.status(500).send({'results':'empty'});
		}
	});
};
exports.detail_packages = function(req, res){
	var sQuery = "Select spesifikasi from m_paket where id_paket = ?";
	var sValues = [req.params.packageId];
	con.query(sQuery, sValues, function(err, result, fields){
		if (err) throw err
		if (result.length > 0) {
			var results = JSON.parse(result[0].spesifikasi);
			res.json({results});			
		}else{
			res.status(500).send({'results':'empty'});
		}
	});
};
exports.detail_themes = function(req, res){
	var sQuery = "Select spesifikasi from m_tema where id_tema = ?";
	var sValues = [req.params.themeId];
	con.query(sQuery, sValues, function(err, result, fields){
		if (err) throw err
		if (result.length > 0) {
			var results = JSON.parse(result[0].spesifikasi);
			res.json({results});			
		}else{
			res.status(500).send({'results':'empty'});
		}
	});
};

exports.list_type_packages = function(req, res){
	con.query("SELECT * FROM m_typelayanan", function(err, results, fields){
		if (err) throw err
		if (result.length > 0) {
			res.json({results});
		}else{
			res.status(500).send({'result':'empty'});
		}
	});
};

exports.register = function(req, res){
	var hashedPassword = bcrypt.hashSync(req.body.password, 8);
	var sQuery = "SELECT * FROM m_akun WHERE email_address=?";
	var sValues = [req.body.email_address];
	con.query(sQuery, sValues, function(err, result, fields){
		if (err) throw err

		if (result.length < 1) {
			var iQuery = "INSERT INTO m_akun "+
				"(first_name, last_name, company_name, email_address, phone_number, password)"+
				"VALUES"+
				"(?,?,?,?,?,?)";
			var iValues = [req.body.first_name, req.body.last_name, req.body.company_name, req.body.email_address, req.body.phone_number, hashedPassword];
			con.query(iQuery, iValues, function(err, result, fields){
					if (err) return res.status(500).send({err});

					con.query("SELECT * FROM m_akun WHERE email_address = '"+req.body.email_address+"'", function(err, result, fields){
						var idUser = result[0].id_user;
						var token = jwt.sign({ id: idUser }, config.secret, {expiresIn: 86400});
						res.json({ auth: true, token: token });
					});
			});
		}else{
			res.status(500).send({'result':'already registered'});
		}
	});
};

exports.login = function(req, res){
	var sQuery = "SELECT * FROM m_akun WHERE email_address=?";
	var sValues = [req.body.email_address];
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
			res.status(500).send({'result':'login failed'});
		}
	});
};

exports.me = function(req, res){
  var token = req.headers['nebeng-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    var sQuery = "SELECT first_name, last_name, company_name, email_address, phone_number FROM m_akun WHERE id_user=?";
    var sValues = [decoded.id];
    con.query(sQuery, sValues, function(err, result, fields){
    	if (err) return res.status(500).send({'result':'cannot get me'});
    	res.json({result});
    });
  });
};

exports.me_update = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded) {
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

		var id = decoded.id;
		var uQuery = "UPDATE m_akun SET "+
				"first_name=?,"+
				"last_name=?,"+
				"company_name=?,"+
				"phone_number=?"+
				"WHERE id_user=?";
		var uValues = [req.body.first_name, req.body.last_name, req.body.company_name, req.body.phone_number, id];
		con.query(uQuery, uValues, function(err, result, fields){
			if (err) return  res.status(500).send({'result':'update failed'});

			res.json({'result':'update success'});
		});
	});
};

exports.address = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded) {
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

		var id = decoded.id;
		var sQuery = "SELECT * FROM m_address WHERE id_akun=?";
		var sValues = [id]
		con.query(sQuery, sValues, function(err, result, fields){
			if (err) throw res.status(500).send({err})
			if (result.length > 0) {
				res.json({result});
			}else{
				res.json({'result':'empty'});
			}
		});
	});
};
exports.save_address = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded) {
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

		var id = decoded.id;
		var address_1 = req.body.address_1;
		var address_2 = req.body.address_2;
		var city = req.body.city;
		var state = req.body.state;
		var zip = req.body.zip;
		var country = req.body.country;
		var sQuery = "SELECT * FROM m_address WHERE id_akun=? AND address_1 =? OR address_2 = ?";
		var sValues = [id, address_1, address_2];
		con.query(sQuery, sValues, function(err, result, fields){
			if (result.length < 1) {
				var iQuery = "INSERT INTO m_address (id_akun, address_1, address_2, city, state, zip, country) VALUES (?,?,?,?,?,?,?)";
				var iValues = [id, address_1, address_2, city, state, zip, country];
				con.query(iQuery, iValues, function(err, result, fields){
					res.json({'result':'Success Insert address'});
				});
			}else{
				res.status(500).send({'result':'Address already use'});
			}
		});

	});
};
exports.update_address = function(req, res){

	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded) {
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

		var id = decoded.id;
		var id_address = req.body.id_address;
		var sQuery = "SELECT * FROM m_address WHERE id_akun=? AND id_address=?";
		var sValues = [id, id_address];
		con.query(sQuery, sValues, function(err, result, fields){
			if (result.length > 0) {
				var address_1 = req.body.address_1;
				var address_2 = req.body.address_2;
				var city = req.body.city;
				var state = req.body.state;
				var zip = req.body.zip;
				var country = req.body.country;

				var uQuery = "UPDATE m_address SET "+
								"address_1=?, address_2=?, city=?, state=?, zip=?, country=? WHERE id_akun=? AND id_address=?";

				var uValues = [address_1, address_2, city, state, zip, country, id, id_address];
				con.query(uQuery, uValues, function(err, result, fields){
					res.json({'result':'Success Update address'});
				});
			}else{
				res.status(500).send({'result':'Cannot get address'});
			}
		});
	});	
};

exports.delete_address = function(req, res){

	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded) {
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

		var id = decoded.id;
		var id_address = req.body.id_address;
		var sQuery = "SELECT * FROM m_address WHERE id_akun=? AND id_address=?";
		var sValues = [id, id_address];
		con.query(sQuery, sValues, function(err, result, fields){
			if (result.length > 0) {
				var address_1 = req.body.address_1;
				var address_2 = req.body.address_2;
				var city = req.body.city;
				var state = req.body.state;
				var zip = req.body.zip;
				var country = req.body.country;

				var dQuery = "DELETE FROM m_address WHERE "+
								"id_akun=? AND id_address=?";
				var dValues = [id, id_address];
				con.query(dQuery, dValues, function(err, result, fields){
					res.json({'result':'Success Delete address'});
				});
			}else{
				res.status(500).send({'result':'Cannot get address'});
			}
		});
	});
};

exports.update_password = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded){
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
		var id = decoded.id;
		var sQuery = "SELECT * FROM m_akun WHERE id_user = ?";
		var sValues = [id];
		con.query(sQuery, sValues, function(err, result, fields){
			var oldPassword = req.body.old_password;
			var passwordUser = result[0].password;
			var passwordIsValid = bcrypt.compareSync(oldPassword, passwordUser);
			if (passwordIsValid) {
				var newPassword = req.body.new_password;
				var hashedPassword = bcrypt.hashSync(newPassword, 8);
				var uQuery = "UPDATE m_akun SET password = ? WHERE id_user = ?";
				var uValues = [hashedPassword, id];
				con.query(uQuery, uValues, function(err, result, fields){
					res.json({'result':'success update password'});
				});
			}else{
				res.status(500).send({'result':'password Salah'});
			}
		});

	});
};

exports.list_order = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded){
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
		var id = decoded.id;
		var sQuery = "SELECT * FROM m_order "+
					"LEFT JOIN m_paket ON m_paket.id_paket = m_order.id_paket "+
					"LEFT JOIN m_tema ON m_tema.id_tema = m_order.id_tema "+
					"LEFT JOIN m_typelayanan ON m_typelayanan.id_type = m_order.id_type "+
					"LEFT JOIN m_domain ON m_domain.id_domain = m_order.id_domain "+
					"WHERE id_user = ?";
		var sValues = [id];
		con.query(sQuery, sValues, function(err, result, fields){
			if (result.length > 0) {
				res.json(result);
			}else{
				res.status(500).send({'result':'empty'});
			}
		});
	});

};

exports.detail_order = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded){
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
		var id = decoded.id;
		var id_order = req.body.id_order;
		var sQuery = "SELECT * FROM m_order "+
					"LEFT JOIN m_paket ON m_paket.id_paket = m_order.id_paket "+
					"LEFT JOIN m_tema ON m_tema.id_tema = m_order.id_tema "+
					"LEFT JOIN m_typelayanan ON m_typelayanan.id_type = m_typelayanan.id_type "+
					"WHERE id_user = ? AND m_order.id_order = ?";
		var sValues = [id, id_order];
		con.query(sQuery, sValues, function(err, result, fields){
			if (result.length > 0) {
				res.json(result);
			}else{
				res.status(500).send({'result':'empty'});
			}
		});
	});

};
exports.list_payments = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded){
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
		var id  = decoded.id;
		var sQuery = "SELECT * FROM t_payment "+
					"LEFT JOIN m_order ON m_order.id_order = t_payment.id_order "+
					"LEFT JOIN m_paket ON m_paket.id_paket = m_order.id_paket "+
					"LEFT JOIN m_tema ON m_tema.id_tema = m_order.id_tema "+
					"LEFT JOIN m_typelayanan ON m_typelayanan.id_type = m_paket.id_type "+
					"LEFT JOIN m_domain ON m_domain.id_domain = m_order.id_domain "+
					"WHERE id_user = ?";
		var sValues = [id];
		con.query(sQuery, sValues, function(err, result, fields){
			if (result.length > 0) {
				res.json(result);
			}else{
				res.status(500).send({'result':'empty'});
			}			
		});
	});

}
exports.detail_payments = function(req, res){
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded){
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
		var id  = decoded.id;
		var id_payments = req.body.id_payment;
		var sQuery = "SELECT * FROM t_payment "+
					"LEFT JOIN m_order ON m_order.id_order = t_payment.id_order "+
					"LEFT JOIN m_paket ON m_paket.id_paket = m_order.id_paket "+
					"LEFT JOIN m_tema ON m_tema.id_tema = m_order.id_tema "+
					"LEFT JOIN m_typelayanan ON m_typelayanan.id_type = m_paket.id_type "+
					"WHERE id_user = ? AND t_payment.id_payment = ?";
		var sValues = [id, id_payments];
		con.query(sQuery, sValues, function(err, result, fields){
			if (result.length > 0) {
				res.json(result);
			}else{
				res.status(500).send({'result':'empty'});
			}			
		});
	});

}
exports.add_order= function(req, res){
	// id paket
	// id tema
	// create date
	// expiry date
	// id user
	// price paket
	// price tema
	// id domain
	// price unik
	// mode payment
	var token = req.headers['nebeng-token'];
	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	jwt.verify(token, config.secret, function(err, decoded){
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
		var id  = decoded.id;

		var id_paket = req.body.id_paket;
		var id_tema = req.body.id_tema;
		var create_date = getCurrentDate();
		var expiry_date = getCurrentDate();
		var id_user = id;
		var price_paket = req.body.price_paket;
		var price_tema = req.body.price_tema;
		var id_domain = req.body.id_domain;
		var price_domain = req.body.price_domain;
		var price_unique = getRndInteger(1000, id);
		var mode_payment = req.body.mode_payment;
		var payment_period = req.body.payment_period;/*0 monthly; 1 anually*/
		var totalPrice = parseInt(parseInt(price_paket)+parseInt(price_tema)+parseInt(price_domain)+parseInt(price_unique));
		if (payment_period == 0) {
			totalPrice = totalPrice;
		}else if(payment_period == 1){
			totalPrice = parseInt(totalPrice) * parseInt(12);
		}
		var iQuery = "INSERT INTO m_order (id_paket, "+
						"id_tema, "+
						"create_date, "+
						"expiry_date, "+
						"id_user, "+
						"price_paket, "+
						"price_tema, "+
						"id_domain, "+
						"price_domain, "+
						"price_unique, "+
						"payment_period, "+
						"mode_payment) "+
						" VALUES "+
						"(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		var iValues = [id_paket,
						id_tema,
						create_date,
						expiry_date,
						id_user,
						price_paket,
						price_tema,
						id_domain,
						price_domain,
						price_unique,
						payment_period,
						mode_payment];

		con.query(iQuery, iValues, function(err, result, fields){
			if (err) throw res.status(500).send({err});
			if(result){
				var iQueryTPayment = "INSERT INTO t_payment "+
									"("+
									"id_order,"+
									"price ,"+
									"create_date,"+
									"payment_method,"+
									"id_bank,"+
									"expiry_date"+
									")"+
									"values"+
									"(?,?,?,?,?,?)";
				var iValuesTPayment = [result.insertId,
										totalPrice,
										create_date,
										mode_payment,
										0,
										expiry_date];
				con.query(iQueryTPayment, iValuesTPayment, function(err, result, fields){
					if (err) throw res.status(500).send({err});
					if (result) {				
						res.json({"result":"Order Berhasil Ditambahkan "+result.insertId});
					}else{
						res.json({"result":result});
					}
				});
			}else{
				res.json({"result":result});
			}
		});
	});

}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function getCurrentDate(){
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();

	if(dd<10) {
	    dd = '0'+dd
	} 

	if(mm<10) {
	    mm = '0'+mm
	} 

	today = yyyy + '/' +mm + '/' + dd;
	return today;
}
// exports.list_service = function(req, res){
// 	var token = req.headers['nebeng-token'];
// 	if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

// 	jwt.verify(token, config.secret, function(err, decoded){
// 		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
// 		var id  = decoded.id;

// 	});

// }

	// var token = req.headers['nebeng-token'];
	// if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

	// jwt.verify(token, config.secret, function(err, decoded){
	// 	if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
	// 	var id  = decoded.id;

	// });
