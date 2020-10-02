'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var TripSchema = new Schema({
  results: [],
  created_date: {
    type: Date,
    default: Date.now
  },
  rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
  }
});

module.exports = mongoose.model('Trip', TripSchema);
