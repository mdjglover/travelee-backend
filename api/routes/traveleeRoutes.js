'use strict';
module.exports = function(app) {
  var travelee = require('../controllers/traveleeController');

  // Travelee routes
  app.route('/trips/:tripId')
    .get(travelee.get_trip_data)
    .put(travelee.rate_trip)

  app.route('/nearby')
    .get(travelee.get_nearby_locations);

  app.route('/suggestion')
    .get(travelee.nearby_suggestion);

  app.route('/create_trip_with_stops')
    .get(travelee.create_trip_with_stops);

  app.route('/create_trip_with_time')
    .get(travelee.create_trip_with_time);
}
