var socket = io("http://localhost:3000");
var username;

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("send").onclick = function () {
    messageSend();
  }; //makes the send button able to send messages to clients
  document.getElementById("chatbox").onkeypress = function () {
    sendMessage();
  }; //makes chatbox send messages by pressing enter

  document.getElementById("exit").onclick = function () {
    disconnectFromServer();
  }; //Disconnect from server

  //when someone sends a message to the server, the server sends it back to ALL clients
  //and in this function each client seperately handles the message.
  socket.on("messageReply", function (data) {
    var nameNode = document.createElement("span");
    var textNode = document.createElement("span");
    textNode.innerHTML = data.text;
    nameNode.innerHTML = "<b>Anonymous : </b>";
    document.getElementById("chat_history").appendChild(nameNode);
    document.getElementById("chat_history").appendChild(textNode);
  });

  socket.on("newUser", function (data) {
    //in case a new user has joined, we handle this annoucement
    var newNode = document.createElement("span");
    newNode.classList.add("bspan");
    newNode.classList.add("announcement");
    newNode.innerHTML = data;
    document.getElementById("chat_history").appendChild(newNode);
  });

  socket.on("testmsg", (data) => {
    console.log(data);
  });

  socket.on("changefeed", (data) => {
    console.log(`Location changefeed updated : `);
    console.log(data);
  });

  // socket.on("connect", () => {
  //   console.log("Connected to server.");
  // });

  // socket.on("disconnect", () => {
  //   console.log("Disconnected from server.");
  // });

  socket.on("connect", () => {
    console.log("Connected");

    socket.emit("authentication", {
      token: getToken(),
      // token: prompt("Enter token :"),
    });
  });

  socket.on("unauthorized", (reason) => {
    console.log("unauthorized called");

    console.log("Unauthorized:", reason);

    error = reason.message;

    socket.disconnect(error);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Disconnected: ${error || reason}`);
    // statusInput.value = `Disconnected: ${error || reason}`;
    // connectButton.disabled = false;
    // disconnectButton.disabled = true;
    error = null;
  });
});

function messageSend() {
  //sends message to the server in order to be transmitted to other clients, then resets the chatbox's content
  if (document.getElementById("chatbox").value != "")
    socket.emit("sendMessage", {
      name: username,
      text: document.getElementById("chatbox").value,
    });
  document.getElementById("chatbox").value = "";
}

function sendMessage() {
  var key = window.event.keyCode;
  if (key == 13) {
    //in case key with ascii code 13 ( enter ) is pressed, we'll send the chatbox's content on the server,and then reset it's content
    messageSend();
    document.getElementById("chatbox").value = "";
  }
}

function disconnectFromServer() {
  console.log("Scoket.close start");
  socket.close();
  console.log("Scoket.close end");
}

function getToken() {
  // return new Promise((resolve, reject) => {
  //   let token = prompt("token");
  //   if (!token) reject(0);
  //   else resolve(token);
  // });
  // return prompt("token");
  return "token";
}
//////////////////////////////////////////
// const socketUrl = 'http://localhost:3000';

// let connectButton;
// let disconnectButton;
// let socket;
// let statusInput;
// let tokenInput;

// const connect = () => {
//   let error = null;

//   socket = io(socketUrl, {
//     autoConnect: false,
//   });

//   socket.on('connect', () => {
//     console.log('Connected');
//     statusInput.value = 'Connected';
//     connectButton.disabled = true;
//     disconnectButton.disabled = false;

//     socket.emit('authentication', {
//       token: tokenInput.value,
//     });
//   });

//   socket.on('unauthorized', (reason) => {
//     console.log('Unauthorized:', reason);

//     error = reason.message;

//     socket.disconnect();
//   });

//   socket.on('disconnect', (reason) => {
//     console.log(`Disconnected: ${error || reason}`);
//     statusInput.value = `Disconnected: ${error || reason}`;
//     connectButton.disabled = false;
//     disconnectButton.disabled = true;
//     error = null;
//   });

//   socket.open();
// };

// const disconnect = () => {
//   socket.disconnect();
// }

// document.addEventListener("DOMContentLoaded", () => {
//   connectButton = document.getElementById("connect");
//   disconnectButton = document.getElementById("exit");
//   statusInput = document.getElementById("status");
//   tokenInput = document.getElementById("token");
// });
