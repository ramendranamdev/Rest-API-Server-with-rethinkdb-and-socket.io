var rdb = require("./rethink");
var secret = process.env.TOKEN_SECRET;
var jwt = require("jwt-simple");

exports.getEmailFromToken = (token) =>
  new Promise((resolve, reject) => {
    try {
      const email = jwt.decode(token, secret).iss;
      resolve(email);
    } catch (err) {
      reject(err);
    }
  });

exports.jsonToGeojson = (data) =>
  new Promise((resolve, reject) => {
    // console.log(data);
    let featureCollection = [];
    data.forEach((user) => {
      // console.log(user);
      let {
        id,
        name,
        email,
        location: { coordinates: coordinates },
      } = user;
      //console.log(id);

      let feature = {
        userid: id,
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: coordinates,
        },
      };

      featureCollection.push(feature);
    });

    let geoJson = {
      type: "FeatureCollection",
      features: featureCollection,
    };

    console.log(geoJson);

    resolve(geoJson);
  });

exports.jsonToFeature = (data) =>
  new Promise((resolve, reject) => {
    let { new_val } = data;
    let {
      id,
      location: { coordinates },
    } = new_val;

    let feature = {
      userid: id,
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: coordinates,
      },
    };

    resolve(feature);
  });

exports.cursorToArray = (cursor) =>
  new Promise((resolve, reject) => {
    let data = [];
    cursor.each((err, result) => {
      if (err) throw err;
      data.push(result);
    });
    resolve(data);
  });
