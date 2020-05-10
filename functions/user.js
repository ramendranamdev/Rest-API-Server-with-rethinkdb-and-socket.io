var rdb = require('../lib/rethink');

exports.getUserIdByEmail = email => 
    new Promise((resolve, reject) => {
        rdb.findBy('users', 'email', email)
        .then(users => {
            let user = users[0];
            let userId = user.id;
            // console.log(userId);
            resolve(userId);
        })
        .catch(err => reject(err))

    })