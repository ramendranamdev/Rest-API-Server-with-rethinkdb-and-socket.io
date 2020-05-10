////////////////////////////////////////////////////////////////////////
// same as aarosil (LIFESAVER)........................MAIN APP.JS FILE /
////////////////////////////////////////////////////////////////////////
const app = require('express')();
const server = app.listen(process.env.PORT || 3000);
const io = require('socket.io')(server);
// next line is the money
app.set('socketio', io);

////////////////////////////////////////////////////////////////////////
//Inside routes file.........................................Route File/
////////////////////////////////////////////////////////////////////////
exports.foo = (req,res) => {

let socket_id = [];
const io = req.app.get('socketio');

io.on('connection', socket => {
socket_id.push(socket.id);
if (socket_id[0] === socket.id) {
// remove the connection listener for any subsequent
// connections with the same ID
io.removeAllListeners('connection');
}

      socket.on('hello message', msg => {
        console.log('just got: ', msg);
        socket.emit('chat message', 'hi from server');

      })

});
}
