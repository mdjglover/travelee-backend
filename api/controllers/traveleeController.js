'use strict';


var mongoose = require('mongoose'),
  Trip = mongoose.model('Trip');
var request = require('request');
var jsonSort = require('sort-json-array');
var key = "INSERT KEY HERE"


exports.get_trip_data = function(req, res) {
  var id = req.params.tripId;
  Trip.findById(id, function(err, trip) {
    if (err)
      res.send("Can't find trip with ID: " + id);
    res.json(trip);
  });
};


exports.rate_trip = function(req, res) {
  var id = req.params.tripId;
  var rating = req.query.rating;
  if (rating && rating > 0 && rating <= 5){
    Trip.findOneAndUpdate({
      _id: id
    }, {'rating': rating},
      function(err, trip) {
      if (err)
        res.send("Can't find trip with ID: " + id);
      res.send("Rating updated");
    });
  } else {
    res.send("Please enter valid rating");
  }

};

exports.get_nearby_locations = function(req, res) {
  if (!req.query.location || !req.query.keyword){
    res.send("Error: please enter location and keyword");
    return;
  }
  var location = req.query.location;
  var userLatLng = location.split(",");
  var userLat = Number(userLatLng[0]);
  var userLng = Number(userLatLng[1]);
  var keywordList = req.query.keyword.split(",");
  var keyword = "";
  if (keywordList.length != 1){
    res.send("Error: please enter a single keyword");
  } else {
    keyword = keywordList[0];
  }
  var rating = 4
  if (req.query.rating && req.query.rating > 0 && req.query.rating <= 5){
    rating = req.query.rating;
  }
  var radius = 500;
  if (req.query.radius){
    radius = req.query.radius;
  }

  var googleReq = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
                  + userLat + "," + userLng
                  + "&radius=" + radius
                  + "&keyword=" + keyword
                  + "&key=" + key;

  request.get(googleReq, function(error, response, body){
    var jsonBody = JSON.parse(body);
    var results = jsonBody.results;
    var toReturn = {results: []};

    if (results.length > 0){
      for (var x in results){
        if (results[x].rating > rating) {
          var result = results[x];

          var destLat = result.geometry.location.lat;
          var destLng = result.geometry.location.lng;

          var distanceFromLast = getDistanceSphere(userLat, userLng, destLat, destLng);
          var walkingTimeFromLast = Math.round(distanceFromLast / 83); // 5km/h walking speed in minutes

          result["distanceFromLast"] = distanceFromLast;
          result["walkingTimeFromLast"] = walkingTimeFromLast;
          toReturn.results.push(result);
        }
      }

      toReturn.results = jsonSort(toReturn.results, "rating", "des");
    }

    res.send(toReturn);
  });


};

exports.create_trip_with_stops = function(req, res) {
  // builds an itinerary for the client based on their current location,
  // supplied keywords and number of stops desired.

  // get user location, keywords and number of stops from query
  if (!req.query.location || !req.query.keywords || !req.query.stops){
    res.send("Error: please enter location, keywords and number of stops");
    return;
  }

  var userLocation = req.query.location;
  var keywords = req.query.keywords;
  var numStops = Number(req.query.stops);
  if (!numStops){
    res.send("Error: please enter valid number of stops");
    return;
  }
  var resultsJSON = {results: []};

  // variables for trip generation
  // already visited locations
  var visitedPlaces = [];

  // list of location types to visit
  var toVisitList = buildToVisitList(keywords);
  var toVisitListIndex = 0;

  getLocation(userLocation, toVisitList[toVisitListIndex]);

  function getLocation(curLocation, keyword){
    // Gets the next stop on the trip and calls an update to trip itinerary

    // construct query to Google
    var radius = 500;
    var googleReq = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
                    + curLocation
                    + "&keyword=" + keyword
                    + "&radius=" + radius
                    + "&key=" + key;

    // send request to Google
    request.get(googleReq, function(error, response, body){
      // get body of response from Google
      var jsonBody = JSON.parse(body);

      // get list of locations from body
      var results = jsonBody.results;

      if (results.length > 0){

      // choose a random location from the results
      var selectedStop = selectStop(results);

      // update the trip with new stop
      updateTrip(selectedStop);
      }
      else {
        updateTrip(null);
      }

      function selectStop(results){
        // Selects a random stop to visit from list of possible locations.
        // Makes sure that location hasn't already been visited.

        var selectedStop;
        do {
          var nextStopIndex = getRandomInt(0, results.length - 1);
          selectedStop = results[nextStopIndex];
        } while (isInArray(selectedStop.name.trim(), visitedPlaces));

        return selectedStop;
      }
    });
  }

  function updateTrip(result){
    // Adds a stop to trip itinerary, and if trip is fully generated
    // makes a call to send the response to the user

    // decrement number of stops left to make
    toVisitListIndex += 1;

    if (result != null){
      // add stop to the trip itinerary if result found
      resultsJSON.results.push(result);
      visitedPlaces.push(result.name.trim());
    }

    if (toVisitListIndex == numStops){
      // return results to user
      sendResponse(resultsJSON);
    } else {
      // get current location in trip
      if (result){
        var stopLocation = result.geometry.location.lat + "," + result.geometry.location.lng;
      }
      // get new trip location based on current location
      getLocation(stopLocation, toVisitList[toVisitListIndex]);
    }
  }

  function sendResponse(resultsJSON){
    if (resultsJSON.results.length > 0){
      // optimize trip route
      resultsJSON.results = optimizeRoute(resultsJSON.results);

      var trip = new Trip(resultsJSON);
      var id = trip._id;
      trip.save(function(err, savedTrip){
      });
      resultsJSON["tripId"] = id

    }
    // return results to user
    res.send(resultsJSON);
  }

  function buildToVisitList(keywords){
    // Builds a list of locations to visit the length of the number of stops
    var toVisitList = [];
    var keywordList = keywords.split(',');

    while (toVisitList.length < numStops){
      var keywordIndex = getRandomInt(0, keywordList.length - 1);
      if ((keywordList[keywordIndex] === "restaurant") && (isInArray("restaurant", toVisitList)) && (keywordList.length > 1)) {
        // limits to only one instance of a restaurant, unless restaurant
        // is the only keyword
        continue;
      } else {
        toVisitList.push(keywordList[keywordIndex]);
      }
    }

    return toVisitList;
  }

  function optimizeRoute(results){
    // builds a travelling salesman route out of list of results, starting at
    // user location.
    // adds distance from previous location and walking time.

    var optimizedRoute = [];

    // start at user location
    var userLatLng = userLocation.split(",");
    var curLat = Number(userLatLng[0]);
    var curLng = Number(userLatLng[1]);

    // variables for choosing closest location from results
    var minLat;
    var minLng;
    var minDistance;
    var minDistIndex;

    while (results.length > 0){
      // iterate until results list is empty and optimizedRoute is full

      // set minDistance to be greater than any possible results
      minDistance = 10000;

      for (var i = 0; i < results.length; i++){
        // go through each item in results, finding the location with minimum
        // distance from current location
        var result = results[i];
        var resultLat = result.geometry.location.lat;
        var resultLng = result.geometry.location.lng;
        var distanceFromLast = getDistanceSphere(curLat, curLng, resultLat,resultLng);

        if (distanceFromLast < minDistance){
          minDistance = distanceFromLast;
          minDistIndex = i;
          minLat = resultLat;
          minLng = resultLng;
        }
      }
      // extract location at minimum distance from current location from results
      var toAdd = results.splice(minDistIndex, 1)[0];

      // add distanceFromLast and walkingTimeFromLast properties to selected location
      toAdd["distanceFromLast"] = minDistance;
      var walkingTime = minDistance / 83; // 5km/h walking speed per minute
      toAdd["walkingTimeFromLast"] = Math.round(walkingTime);

      // set new current location to selected location
      curLat = minLat;
      curLng = minLng;

      // add location to optimizedRoute
      optimizedRoute.push(toAdd);
    }

    return optimizedRoute;
  }
};

exports.create_trip_with_time = function(req, res){
  // creates a trip itinerary based on user location, supplied keywords and
  // time allowed for trip. Time allowed includes walking time between locations.

  // get user location, keywords and number of hours from query
  if (!req.query.location || !req.query.keywords || !req.query.hours){
    res.send("Error: please enter location, keywords and number of hours");
    return;
  }
  var userLocation = req.query.location.split(",");
  var userLat = userLocation[0];
  var userLng = userLocation[1];
  var keywords = req.query.keywords;
  var keywordList = keywords.split(",");
  var totalTripHours = Number(req.query.hours);
  if (!totalTripHours){
    res.send("Error: please enter valid number of hours");
    return;
  }
  var resultsJSON = {results: []};

  // convert hours to minutes
  var totalTripMins = totalTripHours * 60;

  // activity length lookup table
  var activityLengths = {
    "restaurant": 60,
    "cafe": 30,
    "bar": 60,
    "historical landmark": 20,
    "venue": 60,
    "park": 30
  };

  // acceptable activity time lookup table in 24 hour format
  var activityTimes = {
    "restaurant": [12, 13, 14, 17, 18, 19, 20, 21],
    "cafe": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    //"bar": [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2],
    //"historical landmark": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    "venue": [18, 19, 20, 21, 22, 23, 0, 1, 2],
    "park": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  };

  // variables to track current length of trip, visited place types and visited locations names
  var curTripMins = 0;
  var visitedPlaceNames = [];
  var visitedPlaceTypes = [];

  // current time, relative to trip
  var dateObj = new Date();
  var curHours = dateObj.getHours();
  var curMins = dateObj.getMinutes();
  // current location relative to trip
  var curLat = userLat;
  var curLng = userLng;

  // retry variables to stop API from getting hung up
  var nextLocRetries = 0;
  var totalRetries = 0;

  // max queries variable to avoid burning through google api quota
  var totalQueries = 0;

  var type = selectNextLocationType(curHours);

  getNextLocation(curLat, curLng, type);

  function selectNextLocationType(hour){
    // selects the next stop to visit based on current time

    var isSelected = false;
    var type;
    var count = 0;

    while (!isSelected){
      // select an item from the keywordList
      var keyword;
      var keywordSelected = false;
      while (!keywordSelected){
        var keywordIndex = getRandomInt(0, keywordList.length - 1);
        keyword = keywordList[keywordIndex];
        if (keyword === "restaurant" && isInArray("restaurant", visitedPlaceTypes) && keywordList.length > 1){
          // limits to one restaurant in trip, unless restaurant is only item in keywordList
          keywordSelected = false;
        } else {
          keywordSelected = true;
        }
      }
      // prevent infinite loops
      count += 1;
      // check if that item exists in lookup table
      if (activityTimes.hasOwnProperty(keyword) && keywordList.length > 1 && count < 10){
        // check if it is suitable time for location
        if (isInArray(hour, activityTimes[keyword])){
          // if suitable, select keyword and set isSelected to true. Also sets to true if only one keyword to prevent infinite loops
          type = keyword;
          isSelected = true;
        }
      } else {
        // information about keyword not present, assume it's ok
        type = keyword;
        isSelected = true;
      }
    }
    return type;
  }

  function getNextLocation(lat, lng, type){
    // construct query to Google
    var radius = 500;
    var googleReq = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
                    + lat + "," + lng
                    + "&keyword=" + type
                    + "&radius=" + radius
                    + "&key=" + key;

    totalQueries += 1;

    if (totalQueries <= 10){

      // send request to Google
      request.get(googleReq, function(error, response, body){
        // get body of response from Google
        var jsonBody = JSON.parse(body);

        // get list of locations from body
        var results = jsonBody.results;

        if (results.length > 0){
          // choose a random location from the results
          var selectedStop = selectStop(results);

          // update the trip with new stop
          updateTrip(selectedStop, type);
        } else if ( results.length == 0 && nextLocRetries < 3){
          var type = selectNextLocationType(curHours);
          getNextLocation(curLat, curLng, type);
        } else {
          updateTrip(null, null);
        }

        function selectStop(results){
          // Selects a random stop to visit from list of possible locations.
          // Makes sure that location hasn't already been visited.

          var selectedStop;
          var count = 0;
          do {
            var nextStopIndex = getRandomInt(0, results.length - 1);
            selectedStop = results[nextStopIndex];
            count += 1;
            if (count > 10){
              // getting hung up, return what results are available
              selectedStop = null;
              break;
            }
          } while (isInArray(selectedStop.name.trim(), visitedPlaceNames));

          return selectedStop;
        }


      });
    } else {
      updateTrip(null, null);
    }
  }

  function updateTrip(result, type){
    // Adds a stop to trip itinerary, and if trip is fully generated
    // makes a call to send the response to the user
    if (result != null){
      var stop = result;

      // add distanceFromLast and walkingTimeFromLast properties to result, update
      // curLat and curLng with new location data
      var resultLat = stop.geometry.location.lat;
      var resultLng = stop.geometry.location.lng;
      var distanceFromLast = getDistanceSphere(curLat, curLng, resultLat, resultLng);
      var walkingTimeFromLast = Math.round(distanceFromLast / 83);

      stop["distanceFromLast"] = distanceFromLast;
      stop["walkingTimeFromLast"] = walkingTimeFromLast;

      curLat = resultLat;
      curLng = resultLng;

      // add stop to the trip itinerary and
      resultsJSON.results.push(stop);
      visitedPlaceTypes.push(type);
      visitedPlaceNames.push(result.name.trim());

      // update trip time estimate with walking time and location time
      curTripMins += walkingTimeFromLast;
      var timeForLocation;
      if (activityLengths.hasOwnProperty(type)){
        timeForLocation = activityLengths[type];
      } else {
        timeForLocation = 45;
      }

      curTripMins += timeForLocation;
    }

    if (totalQueries >= 10 || curTripMins >= totalTripMins || totalRetries > 3){
      // return results to user
      sendResponse(resultsJSON);
    } else if (result != null){
      // update clock for new location
      updateTime(timeForLocation, walkingTimeFromLast);

      // get new trip location based on current location and type
      var type = selectNextLocationType(curHours);
      getNextLocation(curLat, curLng, type);
    } else {
      totalRetries += 1
      var type = selectNextLocationType(curHours);
      getNextLocation(curLat, curLng, type);
    }
  }

  function updateTime(locationTime, walkingTime){
    // updates global variables curHours and curMins with new time based on
    // previous visited location
    var totalMins = locationTime + walkingTime;
    var hoursToAdd = Math.floor((totalMins + curMins)/60);
    var newMins = (totalMins + curMins) % 60;
    curHours += hoursToAdd;
    curMins = newMins;
  }

  function sendResponse(resultsJSON){
    // return results to user
    if (resultsJSON.results.length > 0){
      var trip = new Trip(resultsJSON);
      var id = trip._id;
      trip.save(function(err, savedTrip){
      });
      resultsJSON["tripId"] = id
    }
    res.send(resultsJSON);
  }
}

exports.nearby_suggestion = function(req, res){
  // Suggests a nearby location to visit based on entered keyword

  var resultsJSON = {results: []};

  // get user location, keyword and optional radius
  if (!req.query.location || !req.query.keywords){
    resultsJSON["error"] = "Please enter location and keywords";
    res.send(resultsJSON);
    return;
  }
  var userLocation = req.query.location;
  var keywords = req.query.keywords;
  var radius = 500;
  if (req.query.radius){
    radius = req.query.radius;
  }

  // retry limit counter
  var totalRetries = 0;

  getLocation();

  function getLocation(){
    var keywordList = keywords.split(",");
    var keywordIndex = getRandomInt(0, keywordList.length-1);
    var keyword = keywordList[keywordIndex];

    // construct Google query

    var googleReq = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
                    + userLocation
                    + "&keyword=" + keyword
                    + "&radius=" + radius
                    + "&key=" + key;

    // send request to Google
    request.get(googleReq, function(error, response, body){
      // get body of response from Google
      var jsonBody = JSON.parse(body);

      // get list of locations from body
      var results = jsonBody.results;

      // choose a random location from the results
      var nextStopIndex = getRandomInt(0, results.length);
      var selectedStop = results[nextStopIndex];

      // calculate distance and walking time
      var userLatLng = userLocation.split(",");
      var userLat = userLatLng[0];
      var userLng = userLatLng[1];

      // makes sure result exists to stop server crashing
      if (selectedStop){

        var destLat = selectedStop.geometry.location.lat;
        var destLng = selectedStop.geometry.location.lng;

        var distanceFromLast = getDistanceSphere(userLat, userLng, destLat, destLng);
        var walkingTimeFromLast = Math.round(distanceFromLast / 83); // 5km/h walking speed in minutes

        selectedStop["distanceFromLast"] = distanceFromLast;
        selectedStop["walkingTimeFromLast"] = walkingTimeFromLast;

        // add to resultsJSON
        resultsJSON.results.push(selectedStop);

        // return result to user
        res.send(resultsJSON);
      } else {
        resultsJSON["error"] = "No result found";
        res.send(resultsJSON);
      }
    });
  }

};

// Utility functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function getDistance(lat1, lng1, lat2, lng2){
  return Math.sqrt(((lat2-lat1)*(lat2-lat1)) + ((lng2-lng1)*(lng2-lng1)));
}

function getDistanceSphere(lat1, lon1, lat2, lon2) {
  // gets distance on the surface of the globe, returns rounded result  in metres
  // From https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 +
          c(lat1 * p) * c(lat2 * p) *
          (1 - c((lon2 - lon1) * p))/2;

  // 12742 = 2 * R (R = 6371 km); * 1000 converts to m
  return Math.round(12742 * Math.asin(Math.sqrt(a)) * 1000);
}

function isInArray(value, array) {
  if (array.indexOf(value) > -1){
    return true;
  }
  return false;
}
