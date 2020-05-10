var express = require("express");
var rdb = require("../lib/rethink");
var auth = require("../lib/auth");
var validator = require("validator");
var router = express.Router();

//Test/Welcome Route
router.get("/hi", function (request, response) {
  let socket_id = [];
  const io = request.app.get("socketio");

  // io.on("connection", (socket) => {
  //   socket_id.push(socket.id);
  //   if (socket_id[0] === socket.id) {
  //     // remove the connection listener for any subsequent
  //     // connections with the same ID
  //     io.removeAllListeners("connection");
  //   } else {
  //     console.log(`New Client: ${socket.id}`);
  //   }

  //   socket.on("hello message", (msg) => {
  //     console.log("just got: ", msg);
  //     socket.emit("chat message", "hi from server");
  //   });
  // });

  response.json({ Message: "Welcome" }).status(200);
});

//List users
router.get("/", auth.authorize, function (request, response) {
  rdb.findAll("users").then(function (users) {
    response.json(users);
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
          response.json("Duplicate Entry !").status(401);
        } else {
          rdb.save("users", newUser).then(function (result) {
            let { changes } = result;
            const userId = changes[0].new_val.id;

            const newUserLocation = {
              userId: userId,
              location: rdb.point(-117.220406, 32.719464),
            };

            rdb.save("location", newUserLocation).then((result) => {
              let { changes } = result;
              console.log(changes[0]);
            });

            console.log(changes[0].new_val.id);

            response.json(result);
          });
        }
      });
  });
});

//Update User
router.put("/:id", auth.authorize, function (request, response) {
  rdb.find("users", request.params.id).then(function (user) {
    var updateUser = {
      name: request.body.user || user.name,
      email: request.body.email || user.email,
    };

    rdb.edit("users", user.id, updateUser).then(function (results) {
      response.json(results);
    });
  });
});

//Delete user by id
router.delete("/:id", auth.authorize, function (request, response) {
  rdb.destroy("users", request.params.id).then(function (results) {
    response.json(results);
  });

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

router.post("/signout", auth.authorize, function (request, response) {
  const { loggedInEmail } = request.locals;
  console.log(loggedInEmail);

  response.json({
    Message: "User logged out successfully",
  });
});

module.exports = router;
