var express = require('express'),
  app = express(),
  port = process.env.PORT || 8888,
  bodyParser = require('body-parser');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// var routes = require('./api/routes/Routes');
// routes(app);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
// app.listen(port);

// console.log('NebengServer RESTful API server started on: ' + port);