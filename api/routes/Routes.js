'use strict';
module.exports = function(app) {
  var controllers = require('../controllers/Controller');
  var admin = require('../controllers/Admin');
/*User Section*/
  app.route('/package')
  		.get(controllers.list_all_packages);
  app.route('/theme')
  		.get(controllers.list_all_themes);
  app.route('/package/:packageType')
  		.get(controllers.list_all_packages_by_type);
  app.route('/package/detail/:packageId')
  		.get(controllers.detail_packages);
  app.route('/theme/detail/:themeId')
  		.get(controllers.detail_themes);
  // app.route('/theme/detail/:themeId')
  // 		.get(controllers.detail_themes);
  app.route('/type/package')
  		.get(controllers.list_type_packages);
  app.route('/me')
  		.get(controllers.me)
  		.put(controllers.me_update);
  app.route('/address')
  		.get(controllers.address)
  		.post(controllers.save_address)
  		.put(controllers.update_address)
  		.delete(controllers.delete_address);
  app.route('/register')
  		.post(controllers.register);
  app.route('/login')
  		.post(controllers.login);
  app.route('/password')
  		.put(controllers.update_password);
  app.route('/order')
  		.get(controllers.list_order)
  		.post(controllers.add_order);
  app.route('/service')
  		.get(controllers.list_payments)
  		.post(controllers.detail_payments);
/*Admin Section*/
  app.route('/admin/registration')
  		.post(admin.register);
  app.route('/admin/login')
  		.post(admin.login);
  app.route('/admin/order')
  		.get(admin.list_order);
  app.route('/admin/payments')
  		.get(admin.list_payments)
  		.post(admin.verified_payments);
  app.route('/checkConnection')
      .get(admin.checkConnection);
};