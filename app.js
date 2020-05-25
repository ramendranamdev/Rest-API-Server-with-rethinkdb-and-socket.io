var express = require("express");
var logger = require("morgan");
var bodyParser = require("body-parser");
var cors = require("cors");
var helmet = require("helmet");

const expsession = require("express-session");

require("dotenv").load();

var users = require("./routes/users");
var login = require("./routes/login");
var location = require("./routes/location");

var rdb = require("./lib/rethink");
var util = require("./lib/util");

var app = express();
var http = require("http").createServer(app);
const io = require("socket.io").listen(http);
const socketAuth = require("socketio-auth");
const adapter = require("socket.io-redis");
const redis = require("./redis-client");

const redisAdapter = adapter({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  // password: process.env.REDIS_PASS || "password",
});

io.adapter(redisAdapter);

////////////SOCKET IO REQUEST LOCAL/////////////////////////////
app.set("socketio", io);
////////////SOCKET IO REQUEST LOCAL/////////////////////////////
let flag1 = "";

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

app.use("/users", users);
app.use("/login", login);
app.use("/location", location);

app.use(function (error, request, response, next) {
  response.status(error.status || 500);
  response.json({ error: error.message, result: "Failed" });
});

// dummy user verification
async function verifyUser(token) {
  return new Promise((resolve, reject) => {
    // setTimeout to mock a cache or database call

    setTimeout(() => {
      // this information should come from your cache or database
      console.log("TOKEN : ", token);
      const users = [
        {
          id: 1,
          name: "a",
          token: "token",
          email: "email@email.com",
        },
        {
          id: 2,
          name: "b",
          token: "b",
          email: "gmail@email.com",
        },
        {
          id: 3,
          name: "c",
          token: "c",
          email: "email@email.com",
        },
        {
          id: 4,
          name: "d",
          token: "d",
          email: "email@email.com",
        },
        {
          id: 5,
          name: "e",
          token: "e",
          email: "email@email.com",
        },
      ];

      let user = users.find((user) => {
        if (user.token === token) return user;
      });

      // const email = "";
      // const t =
      //   "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJyYW1lbmRyYW5hbWRldkBnbWFpbC5jb20iLCJleHAiOjE1ODk3NDI4MTQxMzh9.yUSd5HQUnHH1PTdzU53eyqPKAm2ra_YXB5Y3qi6uMjw";
      // util.getEmailFromToken(t).then((email) => {
      //   console.log(email);
      //   rdb.findBy("users", "email", email).then((users) => {
      //     let u = users[0];
      //     const { id, name, email } = u;
      //     user = {
      //       id: id,
      //       name: name,
      //     };
      //     console.log(`${id} : ${name}`);

      //     if (!user) {
      //       return reject("USER_NOT_FOUND");
      //     }

      //     return resolve(user);
      //   });
      // });

      // console.log(user);

      if (!user) {
        return reject("USER_NOT_FOUND");
      }

      return resolve(user);
    }, 200);
  });
}

socketAuth(io, {
  authenticate: async (socket, data, callback) => {
    const { token } = data;
    // console.log(`TOKEN RECIEVED: ${token}`);

    try {
      const user = await verifyUser(token);
      console.log(user);
      app.set("socket", socket);
      const canConnect = await redis.setAsync(
        `users:${user.id}`,
        socket.id,
        "NX",
        "EX",
        30
      );

      if (!canConnect) {
        return callback({ message: "ALREADY_LOGGED_IN" });
      }

      socket.user = user;

      return callback(null, true);
    } catch (e) {
      console.log(`Error occured:`, e);
      console.log(`Socket ${socket.id} unauthorized.`);
      return callback({ message: "UNAUTHORIZED : " + e });
    }
  },
  postAuthenticate: async (socket) => {
    console.log(`Socket ${socket.id} authenticated.`);
    flag1 = "authenticated";
    socket.conn.on("packet", async (packet) => {
      if (socket.auth && packet.type === "ping") {
        await redis.setAsync(
          `users:${socket.user.id}`,
          socket.id,
          "XX",
          "EX",
          30
        );
      }
    });
  },
  disconnect: async (socket) => {
    console.log(`Socket ${socket.id} disconnected.`);

    if (socket.user) {
      await redis.delAsync(`users:${socket.user.id}`);
      flag1 = "";
    }
  },
});

io.on("connection", (socket) => {
  if ((flag1 = "authenticated")) {
    rdb.tableChangeFeed("location").then((cursor) => {
      cursor.each(function (err, item) {
        //io.emit("changefeed", item.new_val);
        // console.log(item);
        util.jsonToFeature(item).then((feature) => {
          //console.log(feature);
          //io.emit("changefeed", feature);
          // socket.emit("changefeed", feature);
          //##############################################
          // socket.emit("changefeed", "changefeed feature");
          rdb
            .eqJoin("users", "location", "location", false, [
              "id",
              "name",
              "email",
              "location",
            ])
            .then((cursor) => {
              util.cursorToArray(cursor).then((data) => {
                util.jsonToGeojson(data).then((result) => {
                  //console.log(result);
                  // response.json(result);
                  socket.emit("changefeed", result);
                });
              });
            });
        });
      });
      //util.cursorToArray(cursor).then((data) => {
      //  console.log(data);
      //});
      //##############################################
      // socket.emit("changefeed", "changefeed feature");
      // rdb
      //   .eqJoin("users", "location", "location", false, [
      //     "id",
      //     "name",
      //     "email",
      //     "location",
      //   ])
      //   .then((cursor) => {
      //     util.cursorToArray(cursor).then((data) => {
      //       util.jsonToGeojson(data).then((result) => {
      //         console.log(result);
      //         // response.json(result);
      //         socket.emit("changefeed", result);
      //       });
      //     });
      //   });
    });
  }
});

var server = http.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("App is listening on http://%s:%s", host, port);
});
