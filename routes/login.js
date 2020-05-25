var express = require("express");
var rdb = require("../lib/rethink");
var auth = require("../lib/auth");
var token = require("../lib/token");

var router = express.Router();

//Login and allocate token to the user
router.post("/", function (request, response, next) {
  rdb.findBy("users", "email", request.body.email).then(function (user) {
    user = user[0];

    if (!user) {
      var userNotFoundError = new Error("User not found");
      userNotFoundError.status = 404;
      return next(userNotFoundError);
    }

    auth
      .authenticate(request.body.password, user.password)
      .then(function (authenticated) {
        if (authenticated) {
          // console.log("USER: ", user);

          var currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            token: token.generate(user),
          };

          var updateUser = {
            token: currentUser.token,
          };

          rdb.edit("users", user.id, updateUser).then(function (results) {
            response.json({ user: currentUser, Status: "OK", CODE: "200" });
          });

          // response.json(currentUser);
        } else {
          //var authenticationFailedError = new Error("Authentication failed");
          //authenticationFailedError.status = 401;
          //return next(authenticationFailedError);
          response.json({ Status: "Login failed", CODE: "401" });
        }
      });
  });
});

module.exports = router;
