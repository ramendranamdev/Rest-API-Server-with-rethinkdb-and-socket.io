var rdb = require("rethinkdb");
var dbConfig = require("../config/database");

var connection = rdb.connect(dbConfig).then(function (connection) {
  module.exports.find = function (tableName, id) {
    return rdb
      .table(tableName)
      .get(id)
      .run(connection)
      .then(function (result) {
        return result;
      });
  };

  module.exports.findAll = function (tableName) {
    return rdb
      .table(tableName)
      .run(connection)
      .then(function (cursor) {
        return cursor.toArray();
      });
  };

  module.exports.findBy = function (tableName, fieldName, value) {
    return rdb
      .table(tableName)
      .filter(rdb.row(fieldName).eq(value))
      .run(connection)
      .then(function (cursor) {
        return cursor.toArray();
      });
  };

  module.exports.findIndexed = function (tableName, query, index) {
    return rdb
      .table(tableName)
      .getAll(query, { index: index })
      .run(connection)
      .then(function (cursor) {
        return cursor.toArray();
      });
  };

  module.exports.save = function (tableName, object) {
    return rdb
      .table(tableName)
      .insert(object, { returnChanges: true })
      .run(connection)
      .then(function (result) {
        return result;
      });
  };

  module.exports.edit = function (tableName, id, object) {
    return rdb
      .table(tableName)
      .get(id)
      .update(object, { returnChanges: true })
      .run(connection)
      .then(function (result) {
        return result;
      });
  };

  module.exports.destroy = function (tableName, id) {
    return rdb
      .table(tableName)
      .get(id)
      .delete()
      .run(connection)
      .then(function (result) {
        return result;
      });
  };

  module.exports.point = function (longitude, latitude) {
    return rdb.point(longitude, latitude);
  };

  module.exports.tableChangeFeed = (tableName) => {
    return rdb
      .table(tableName)
      .changes()
      .run(connection)
      .then((cursor) => {
        return cursor;
      })
      .catch((err) => {
        throw err;
      });
  };

  module.exports.locationData = function (params) {
    return rdb
      .table("location")
      .eqJoin("userid", rdb.table("users"))
      .run(connection)
      .then((result) => {
        return result;
      });
  };

  module.exports.eqJoin = (
    leftTable,
    leftTableField,
    rightTable,
    toArray = false,
    pluck = ""
  ) => {
    return rdb
      .table(leftTable)
      .eqJoin(leftTableField, rdb.table(rightTable))
      .zip()
      .pluck(pluck)
      .run(connection)
      .then((cursor) => {
        if (toArray) {
          cursor.toArray(function (err, results) {
            if (err) throw err;
            // processResults(results);
            return results;
          });
        }
        return cursor;
      });
  };
});
