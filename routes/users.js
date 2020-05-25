var express = require("express");
var rdb = require("../lib/rethink");
var auth = require("../lib/auth");
var validator = require("validator");
var router = express.Router();
var util = require("../lib/util");

//Test/Welcome Route
router.get("/hi", function (request, response) {
  const socket = request.app.get("socket");
  if (!socket) {
  } else {
    console.log(socket.id);
    console.log(socket.user);
    socket.emit("testmsg", "Test MSG");
  }
  response.json("Welcome");
});

//List users
router.get("/", auth.authorize, function (request, response) {
  rdb.findAll("users").then(function (users) {
    response.json(users);
  });
});

router.get("/currentUser", auth.authorize, function (request, response) {
  const { loggedInEmail } = request.locals;
  rdb.findBy("users", "email", loggedInEmail).then((users) => {
    let user = users[0];
    console.log(user);
    response.json({ Success: "OK", data: user });
  });
});

//List user by id
router.get("/:id", auth.authorize, function (request, response, next) {
  rdb.find("users", request.params.id).then(function (user) {
    if (!user) {
      var notFoundError = new Error("User not found");
      notFoundError.status = 404;
      return next(notFoundError);
    }

    response.json(user);
  });
});

//Register
router.post("/", function (request, response) {
  if (
    request.body.password == undefined ||
    request.body.password == "" ||
    request.body.password == null
  ) {
    response
      .json({
        Message: "Password Required",
      })
      .status(400);
  }

  if (!validator.isEmail(request.body.email)) {
    response
      .json({
        Message: "Email Required",
      })
      .status(400);
  }

  if (request.body.name == "" || request.body.name == undefined) {
    response
      .json({
        Message: "Name Required",
      })
      .status(400);
  }

  auth.hash_password(request.body.password).then(function (hash) {
    var newUser = {
      name: request.body.name,
      email: request.body.email,
      password: hash,
      token: "<token>",
    };

    let user;

    rdb
      .findBy("users", "email", request.body.email)
      .then((users) => {
        user = users[0];
      })
      .then(() => {
        if (user) {
          response
            .json({
              Message: "Duplicate Entry !",
              Status: "Request Failed",
              CODE: "409",
            })
            .status(409);
        } else {
          const newUserLocation = {
            location: rdb.point(-117.220406, 32.719464),
          };

          rdb
            .save("location", newUserLocation)
            .then((result) => {
              let { changes } = result;
              const locationId = changes[0].new_val.id;

              console.log(`Location object saved: ${locationId}`);

              var newUser = {
                name: request.body.name,
                email: request.body.email,
                password: hash,
                location: locationId,
                token: "<token>",
              };

              rdb.save("users", newUser).then((result) => {
                let res = result.changes[0].new_val;
                response.json({
                  Message: "Registered Successfully",
                  Result: res,
                });
              });
            })
            .catch((err) => {
              rdb.destroy("location", locationId).then(() => {
                console.log(err);
                console.log("Location object deleted");
                response.json({ Message: "Error", Error: err });
              });
            });
        }
      });
  });
});

//Update User
router.put("/:id", auth.authorize, function (request, response) {
  rdb
    .find("users", request.params.id)
    .then(function (user) {
      var updateUser = {
        name: request.body.name || user.name,
        email: request.body.email || user.email,
      };

      rdb.edit("users", user.id, updateUser).then(function (results) {
        response.json(results);
      });
    })
    .catch((err) => {
      response.json({
        Message: "Error",
        Suggetion: "Check user id",
        Error: err,
      });
    });
});

//Delete user by id
router.delete("/:id", auth.authorize, function (request, response) {
  const userId = request.params.id;

  if (userId == "")
    response.json({ Message: "Please use valid user id", Error: err });

  rdb
    .find("users", userId)
    .then((user) => {
      let { location } = user;

      rdb
        .destroy("location", location)
        .then((result) => {
          rdb
            .destroy("users", userId)
            .then((result) =>
              response.json({ Message: "User removed successfully" })
            )
            .catch((err) =>
              response.json({ Message: "Cannot remove user", Error: err })
            );
        })
        .catch((err) =>
          response.json({
            Message: "Can not remove location data of user",
            Status: "Request Failed",
            Error: err,
          })
        );
    })
    .catch((err) => {
      response.json({
        Message: "User nt found",
        Error: err,
      });
    });

  // rdb.destroy("users", request.params.id).then(function (results) {
  //   response.json(results);
  // });

  // .then( () => {
  //     rdb.findBy("users","email","ramendranamdev@gmail.com")
  //     .then(result => {
  //         result.forEach(element => {
  //             rdb.destroy('users', element.id)
  //             .then(function (results) {
  //                 console.log(result);
  //             })
  //         });
  //         response.json('Deleted All');
  //     })
  // });
});

//Signout
router.post("/signout", auth.authorize, function (request, response) {
  const { loggedInEmail } = request.locals;
  console.log(loggedInEmail);

  response.json({
    Message: "User logged out successfully",
  });
});

module.exports = router;
