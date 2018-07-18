'use strict';
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "nebengserver.com",
  user: "admin_default",
  password: "beni123",
  database: "admin_default"
});
con.connect(function(err) {
	if (err) throw err
});

exports.list_all_packages = function(req, res) {
	var sQuery = "select id_paket, nama_paket, harga, nama_type FROM m_paket LEFT JOIN m_typelayanan ON m_paket.id_type = m_typelayanan.id_type";
  con.query(sQuery,  function (err, results, fields){
  	if (err) throw err
  	if (results.length > 0) {
			res.json({results});
  	}else{
			res.json({'results':'empty'});
  	}
  });
};
exports.list_all_packages_by_type = function(req, res) {
	var sQuery = "select id_paket, nama_paket, harga, nama_type FROM m_paket LEFT JOIN m_typelayanan ON m_paket.id_type = m_typelayanan.id_type WHERE m_typelayanan.id_type = "+req.params.packageType;
  con.query(sQuery,  function (err, results, fields){
  	if (err) throw err
  	if (results.length > 0) {
			res.json({results});
  	}else{
			res.json({'results':'empty'});
  	}
  });
};
exports.detail_packages = function(req, res){
	con.query("Select spesifikasi from m_paket where id_paket = "+req.params.packageId, function(err, result, fields){
		if (err) throw err
		if (result.length > 0) {
			var results = JSON.parse(result[0].spesifikasi);
			res.json({results});			
		}else{
			res.json({'results':'empty'});
		}
	});
};

