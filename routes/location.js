var express = require("express");
var rdb = require("../lib/rethink");
var auth = require("../lib/auth");
var token = require("../lib/token");
var location = require("../functions/location");
var user = require("../functions/user");
var util = require("../lib/util");

var router = express.Router();

const coordinates = {
  longitude: -20,
  latitude: 40,
};

//Send location data-name
router.get("/data", auth.authorize, function (request, response) {
  let data = [];
  rdb
    .eqJoin("users", "location", "location", false, [
      "id",
      "name",
      "email",
      "location",
    ])
    .then((cursor) => {
      util
        .cursorToArray(cursor)
        .then((data) => {
          util
            .jsonToGeojson(data)
            .then((result) => {
              console.log(result);
              response.json({
                Message: "Request Successfull",
                Status: "Success",
                Data: result,
                CODE: 200,
              });
            })
            .catch((err) => {
              Response.json({
                Message: "Location data request failed",
                Error: err,
                CODE: 204,
              });
            });
        })
        .catch((err) => {
          Response.json({
            Message: "Location data request failed",
            Error: err,
            CODE: 204,
          });
        });
    })
    .catch((err) => {
      Response.json({
        Message: "Location data request failed",
        Error: err,
        CODE: 204,
      });
    });
});

//Get User Location
router.get("/", auth.authorize, function (request, response) {
  const { loggedInEmail } = request.locals;

  console.log(loggedInEmail);

  rdb
    .findBy("users", "email", loggedInEmail)
    .then((users) => {
      let user = users[0];
      const locationId = user.location;
      console.log(locationId);
      rdb
        .find("location", locationId)
        .then((location) => {
          response.json({
            Message: "Location Recieved",
            location: location,
          });
        })
        .catch((err) => {
          response.json({
            Message: "Error Recieved",
            Error: err.Message,
          });
        });
    })
    .catch((err) => {
      response.json({
        Message: "Error Recieved",
        Error: err.Message,
      });
    });
});

router.get("/:userId", auth.authorize, function (request, response) {
  location
    .userLocation(request.params.userId)
    .then((location) => {
      response.json({
        Message: "Location Recieved",
        location: location,
      });
    })
    .catch((err) => {
      response.json({
        Message: "Error Recieved",
        Error: err.Message,
      });
    });
});

//Update Location Of Perticular User
router.put("/:userid", auth.authorize, function (request, response) {
  const userId = request.params.userid;

  if (userId == "") {
    response.json({
      Message: "User id not supplied",
      Status: "Request Failed",
    });
  }

  let coordinates = {
    longitude: request.body.longitude,
    latitude: request.body.latitude,
  };

  if (coordinates.longitude == "" || coordinates.latitude == "") {
    response.json({
      Message: "Update request failed",
      Suggetion: "Check Longitude / Latitude",
    });
  }

  rdb
    .find("users", userId)
    .then((user) => {
      let locationId = user.location;

      const newLocation = {
        location: rdb.point(coordinates.longitude, coordinates.latitude),
      };

      rdb
        .edit("location", locationId, newLocation)
        .then((result) =>
          response.json({
            Message: "Location Updated",
            Status: "Successfull",
            Result: result.changes,
          })
        )
        .catch((err) =>
          response.json({
            Message: "Location update failed",
            Error: err,
          })
        );
    })
    .catch((err) =>
      response.json({
        Message: "User not found",
        Error: err,
      })
    );
});

//Update user location of current logged in/Active   user
router.put("/", auth.authorize, function (request, response) {
  // const userId = "12833dbd-9ad1-4cb2-ab69-394dbb4cc89d";

  let coordinates = {
    longitude: request.body.longitude,
    latitude: request.body.latitude,
  };

  // console.log(coordinates);

  if (coordinates.longitude == "" || coordinates.latitude == "") {
    response.json({
      Message: "Update request failed",
      Suggetion: "Check Longitude / Latitude",
    });
  }

  const { loggedInEmail } = request.locals;
  // console.log(loggedInEmail);

  rdb
    .findBy("users", "email", loggedInEmail)
    .then((users) => {
      let locationId = users[0].location;

      const newLocation = {
        location: rdb.point(coordinates.longitude, coordinates.latitude),
      };

      rdb
        .edit("location", locationId, newLocation)
        .then((result) => response.json(result))
        .catch((err) => response.json({ Error: err }));
    })
    .catch((err) => {
      response.json({
        Message: "User not found",
        Error: err,
      });
    });
});

module.exports = router;
