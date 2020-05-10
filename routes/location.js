var express = require('express');
var rdb = require('../lib/rethink');
var auth = require('../lib/auth');
var token = require('../lib/token');
var location = require('../functions/location');
var user = require('../functions/user');

var router = express.Router();

const coordinates = {
    longitude: -20,
    latitude: 40
}

//Get User Location
router.get('/', auth.authorize, function(request, response){

    const {loggedInEmail} = request.locals;
    
    console.log(loggedInEmail);

    rdb.findBy('users', 'email', loggedInEmail)
    .then( users => {
        let user = users[0];
        const userId = user.id;
        
        location.userLocation(userId)
        .then(location => {
            response.json({
                Message: "Location Recieved",
                location: location
            });
        })
        .catch(err => {
            response.json({
                Message: "Error Recieved",
                Error: err.Message
            }); 
        })
    })
    .catch(err => {
        response.json({
            Message: "Error Recieved",
            Error: err.Message
        }); 
    })
    
    // location.userLocation(userId)
    // .then(location => {
    //     response.json({
    //         Message: "Location Recieved",
    //         location: location
    //     });
    // })
    // .catch(err => {
    //     response.json({
    //         Message: "Error Recieved",
    //         Error: err.Message
    //     }); 
    // })
    
})

router.get('/:userId', auth.authorize, function(request, response){

    location.userLocation(request.params.userId)
    .then(location => {
        response.json({
            Message: "Location Recieved",
            location: location
        });
    })
    .catch(err => {
        response.json({
            Message: "Error Recieved",
            Error: err.Message
        }); 
    })

})

//Update Location Of Perticular User
router.put('/:userid', auth.authorize, function(request, response){

    rdb.findBy('location', 'userId', request.params.userid)
    .then( function (location) {
        console.log(location[0].id);
        
        const locationObjetcId = location[0].id;

        let coordinates = {
            longitude: request.body.longitude,
            latitude: request.body.latitude
        }

        if( coordinates.longitude == "" || coordinates.latitude == "" ){
            response.json({
                Message: "Update request failed",
                Suggetion: "Check Longitude / Latitude"
            })
        }

        const newLocation = {
            location: rdb.point(coordinates.longitude, coordinates.latitude)
        }

        rdb.edit('location', locationObjetcId, newLocation)
        .then(result => {
            console.log(result.changes[0]);
            response.json(result).status(result.status);
        }).catch(err => {
            response.json({
                Message: "Location update Failed",
                Error: err.Message
            }).status(err.status);
        })

    })

    // response.json("Dummy Location Message : UPDATE REQUEST");
})

//Update user location of current logged in user
router.put('/', auth.authorize, function(request, response){

    // const userId = "12833dbd-9ad1-4cb2-ab69-394dbb4cc89d";
    const {loggedInEmail} = request.locals;
    
    console.log(loggedInEmail);

    user.getUserIdByEmail(loggedInEmail)
    .then( userId => {
        rdb.findBy('location', 'userId', userId)
        .then( function (location) {
            console.log(location[0].id);
            
            const locationObjetcId = location[0].id;

            let coordinates = {
                longitude: request.body.longitude,
                latitude: request.body.latitude
            }

            if( coordinates.longitude == "" || coordinates.latitude == "" ){
                response.json({
                    Message: "Update request failed",
                    Suggetion: "Check Longitude / Latitude"
                })
            }

            const newLocation = {
                location: rdb.point(coordinates.longitude, coordinates.latitude)
            }

            rdb.edit('location', locationObjetcId, newLocation)
            .then(result => {
                console.log(result.changes[0]);
                response.json(result).status(result.status);
            }).catch(err => {
                response.json({
                    Message: "Location update Failed",
                    Error: err.Message
                }).status(err.status);
            })

        })
    })
    .catch(err => {
        response.json({
            Message: "Location update Failed",
            Error: err.Message
        }).status(err.status);
    })


})

module.exports = router;