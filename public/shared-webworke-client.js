var socket = io("http://localhost:3000");
var ws = wio("http://localhost:8000/");
ws.setWorker("node_modules/socketio-shared-webworker/shared-worker.js");

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

  socket.on("connect", () => {
    console.log("Connected to server.");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server.");
  });

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
