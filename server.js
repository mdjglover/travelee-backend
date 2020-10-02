var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000;

  mongoose = require('mongoose');
  Trip = require('./api/models/traveleeModel');
  bodyParser = require('body-parser');

  //Mongoose connection
  mongoose.Promise = global.Promise;
  mongoose.connect('mongodb://root:travelee@ds115579.mlab.com:15579/travelee');
  //mongoose.connect('mongodb://localhost/db')

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());

  var routes = require('./api/routes/traveleeRoutes');
  routes(app);

app.listen(port);

console.log('Travelee RESTful API server started on: ' + port);
