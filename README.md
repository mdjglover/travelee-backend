# Middleware Service - Places

// API IP and port
http://108.61.196.188:3000

// API Calls

Nearby places : location, keyword, [radius], [rating]

  - GET /nearby?location= &keyword= [&radius=] [&rating=]

Returns list of nearby locations based on the keyword. Can optionally specify
radius. Can also optionally specify a rating between 0 and 5

Returns an JSON object in the format:
{ results: [googleResponses] }
and is sorted by rating

--------------------

Nearby suggestion : location, keyword, [radius]

  - GET /suggestion?location= &keyword= [&radius=]

Selects a random nearby location based on keyword submitted. Can optionally
specify radius. Takes only one keyword.

Returns an JSON object in the format:
{ results: [googleResponses] }
Contains one result


---------------------

Create a trip with stops: location, keywords, number of stops

  - GET /create_trip?location= &keywords= &stops=

keywords must be separated by a ","

Returns a list of locations with the specified number of stops that can contain
the location types mentioned in "keywords"

Returns an JSON object in the format:
{ results: [googleResponses],
  tripId: id }

------------------------------
Create a trip with hours: location, keywords, number of hours

  - GET /create_trip_with_time?location= &keywords= &hours=

keywords must be separated by a ","

Returns a list of locations that fills the number of hours in "hours" that can
contain the location types mentioned in "keywords"

Returns a JSON object in the format:
{ results: [googleResponses] }

------------------------------
Get data of previously generated trip: tripId

  - GET /trips/:tripId

Returns a JSON object in the format:
{ results: [googleResponses],
  created_date: Date,
  rating: Number,
  _ id : String,
  _ v : Number
  }

or an error message if ID does not exist

--------------------------------
Update the rating of a previously generated trip: tripId, rating

  - Put /trips/:tripId?rating=

Rating must be a value between 1 and 5.

Returns a success message if trip exists and rating is valid,
or an error message

--------------------------------

// Useful Query Keywords:

restaurant
cafe
bar
live+music
performing+arts+theatre
movie+theatre
museum
art+gallery
historical+landmark
park

------------------------------
// Example Travelee response:

  {
      "results": [
          {
              "geometry": {
                  "location": {
                      "lat": 51.8978394,
                      "lng": -8.478161199999999
                  },
                  "viewport": {
                      "northeast": {
                          "lat": 51.89908992989271,
                          "lng": -8.476786120107278
                      },
                      "southwest": {
                          "lat": 51.89639027010727,
                          "lng": -8.479485779892721
                      }
                  }
              },
              "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png",
              "id": "01564e897bc0988c257182b83f86a5eadfbf165a",
              "name": "Liberty Grill",
              "opening_hours": {
                  "open_now": true,
                  "weekday_text": []
              },
              "photos": [
                  {
                      "height": 1365,
                      "html_attributions": [
                          "<a href=\"https://maps.google.com/maps/contrib/102720158200618939646/photos\">Liberty Grill</a>"
                      ],
                      "photo_reference": "CmRaAAAAOFvC8bVMc1rKSLCWa2ca_m6JaL5MYsDBq_NTPMG4r9u-T2pREP4UFpwatYlNCru6Lpw1H3h-qC9sW9R5aG0L6_D0CFYLVk8tR3fGL6mDXXyceYg4VVVWvG1IiqB6F83GEhBH5hFoXs9op14z_D_wpM_jGhRzKWErj7ZO8gP5KYgcb3oD6r2G5g",
                      "width": 2048
                  }
              ],
              "place_id": "ChIJ2TEpSheQREgRApQZYZ4l168",
              "rating": 4.6,
              "reference": "CmRbAAAAFaOAPI-BRGSvY5wPV22fRFRdgJumW2HP7vTV73nJoChKw8Ng1j3FJdLEbOOZOWFHkXXO2fjxJVvpM-Mf5PI880hW6pDT5QvpdV-QkrjeUP1ln5mw6BFh2aEwMfFrag-DEhDQ6exY1M-uo3LbX_iKJthUGhSRvt4w6wVr_EuxRhbgnY5coV2Ivg",
              "scope": "GOOGLE",
              "types": [
                  "restaurant",
                  "food",
                  "point_of_interest",
                  "establishment"
              ],
              "vicinity": "Washington House, 32 Washington St, Centre, Cork",
              "distanceFromLast": 192,
              "walkingTimeFromLast": 2
          },
          {
              "geometry": {
                  "location": {
                      "lat": 51.898212,
                      "lng": -8.470123899999999
                  },
                  "viewport": {
                      "northeast": {
                          "lat": 51.89956182989273,
                          "lng": -8.468774070107276
                      },
                      "southwest": {
                          "lat": 51.89686217010728,
                          "lng": -8.47147372989272
                      }
                  }
              },
              "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/cafe-71.png",
              "id": "a51447b8eccb7662187f20ff64b42ad7fb9ef808",
              "name": "143 Vegan Cafe",
              "opening_hours": {
                  "open_now": true,
                  "weekday_text": []
              },
              "place_id": "ChIJZ1dn5g-QREgRJyoWoG2wW68",
              "reference": "CmRbAAAAe3PtUW_rBTJQ1aETBj3OYqL-mp5PZnCE7z2TzudxfB6yk8O1M41v1xLIlyMeBwexhyrs7Bh8xzLDwguGdAgkgRctf-jcg_F4LZ9P7t_zeM2TqN_GrVULv7jWXUV3AiVOEhD8ZYHdzOfAZVChWwlLasGnGhQRodaFic9QWSgonJgyYF7OujSqbg",
              "scope": "GOOGLE",
              "types": [
                  "cafe",
                  "food",
                  "point_of_interest",
                  "establishment"
              ],
              "vicinity": "143 Lower Glanmire Rd, Centre, Cork",
              "distanceFromLast": 553,
              "walkingTimeFromLast": 7
          }
      ],
      "tripId": "5acc94694f1ac827f12fd94c"
  }


// Example Google Places response:

  {
      "geometry": {
          "location": {
              "lat": 51.8952592,
              "lng": -8.4725253
          },
          "viewport": {
              "northeast": {
                  "lat": 51.89661037989272,
                  "lng": -8.471183270107279
              },
              "southwest": {
                  "lat": 51.89391072010727,
                  "lng": -8.473882929892723
              }
          }
      },
      "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/bar-71.png",
      "id": "95f4832fab2e2d8bfc5a38093c9de5d658ae5604",
      "name": "The Laurel Bar",
      "photos": [
          {
              "height": 3058,
              "html_attributions": [
                  "<a href=\"https://maps.google.com/maps/contrib/105453233671906425261/photos\">Liam Mackey</a>"
              ],
              "photo_reference": "CmRaAAAAq5OVRkLCYSgFO0ZTb0hTI9KjPYjvdwasiYAATzRpf5Q9UmdmkfAVGL4UcKrSDH62Iq02feO0pfkOoLnd1MWCRmmJbVrzbLaIL4Yu3SNNQTgz5Tqz23gm7M8aCg1Iu7eMEhCR7QqmUHPUuIVHRCZb4RZzGhTsndf37T7ARi6vrWarq4Vvxjhibg",
              "width": 2294
          }
      ],
      "place_id": "ChIJz2z98RqQREgR8Act4UtuWwI",
      "rating": 5,
      "reference": "CmRbAAAAONV94oiD4BVBi7idC_FAc-Hu4YrMtHqQg06yrpmXz9DaFN8FzWm8r-8Girwk8uHl3CQKYuApdbgBkz_XKoWiPjOBXXJcX1VM0zj6SVVLFn4SUk3ah6CfeS8DFiYbh47KEhDalrYGPLjSPI-p5gDIYNh9GhTxVQI5w5huZFWFIQzytwa9XzdJZg",
      "scope": "GOOGLE",
      "types": [
          "bar",
          "point_of_interest",
          "establishment"
      ],
      "vicinity": ""
  }
