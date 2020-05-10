var rdb = require("../lib/rethink");

exports.userLocation = (userId) =>
  new Promise((resolve, reject) => {
    rdb
      .findBy("location", "userId", userId)
      .then((location) => {
        resolve(location[0]);
      })
      .catch((err) => {
        reject(err);
      });
  });
