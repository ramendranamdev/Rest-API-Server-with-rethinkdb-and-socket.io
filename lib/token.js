var jwt = require('jwt-simple');
var moment = require('moment');
var secret = process.env.TOKEN_SECRET;

var rdb = require('./rethink')

module.exports.generate = function (user) {
    var expires = moment().add(7, 'days').valueOf();
    return jwt.encode({ iss: user.email, exp: expires }, secret);
};

module.exports.verify = function (token, next) {
    if(!token) {
        var notFoundError = new Error('Token not found');
        notFoundError.status = 404;
        return next(notFoundError);
    }

    //==========Check Token In Database==========================================
    const email = jwt.decode(token, secret).iss;
    // console.log(`Email: ${email}`);
    
    rdb.findBy("users","email",email)
    .then(users => {

        let user = users[0];

        if(!user){
            var notFoundError = new Error('Invalid account.');
            notFoundError.status = 404;
            return next(notFoundError);
        }

        const userToken = user.token;
        if(userToken == "" || userToken == undefined){
            var notFoundError = new Error('Token not linked to any account');
            notFoundError.status = 404;
            return next(notFoundError);
        }

        if( token !== user.token ){
            var notFoundError = new Error('Token changed.Retry Login');
            notFoundError.status = 404;
            return next(notFoundError);
        }
        
    })
    //===========================================================================

    if(jwt.decode(token, secret) <= moment().format('x')) {
        var expiredError = new Error('Token has expired');
        expiredError.status = 401;
        return next(expiredError);
    }
};


module.exports.decode = function(token){
    return jwt.decode(token, secret)
}