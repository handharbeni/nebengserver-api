'use strict';
module.exports = function(app) {
  var controllers = require('../controllers/Controller');

  // todoList Routes
  app.route('/package').get(controllers.list_all_packages);
  app.route('/package/:packageType').get(controllers.list_all_packages_by_type);
  app.route('/package/detail/:packageId').get(controllers.detail_packages);


  // app.route('/tasks/:taskId')
  //   .get(todoList.read_a_task)
  //   .put(todoList.update_a_task)
  //   .delete(todoList.delete_a_task);
};