var express = require('express'),
  app = express(),
  port = process.env.PORT || 8888,
  bodyParser = require('body-parser');



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./api/routes/Routes');
routes(app);


app.listen(port);

console.log('NebengServer RESTful API server started on: ' + port);