// Protect Global Namespace
// Execute Function Immediately
// Basic App setup
var RPSapp = {};
    RPSapp.fingerCount; // Fingers Detected via LEAP
    RPSapp.playerChoice; // Choice derivered from Fingers
    RPSapp.playerList = $('#player-list');
    RPSapp.pubNub; // PubNub API
    RPSapp.thisUserID; //The local user ID
    RPSapp.channelID = window.location.hash !== "" ? window.location.hash.split('#')[1] : createGameId(); // Start or Join Game Room
    RPSapp.gameRunning = true; // State for game based on clock
    RPSapp.injectedUsers = []; // Quick Reference for users on page
    RPSapp.injectedUsersDictionary = {}; // DOM Dictionary for Injected Users
    RPSapp.init = function (){
      initPubNub();
      initLeap();
    }

// TODO: Replace Clock w/ TimeStamp via Presence API
// http://www.pubnub.com/docs/javascript/overview/presence.html#_using_presence_api

//Setup new PubNub Object c w/ auth Keys
function initPubNub() {
  callStackReporter('initPubNub()');

  // Connect to Pubnub with AUTH keys
  // And a unique ID
  RPSapp.pubNub = PUBNUB.init({
    publish_key   : 'pub-c-d1d43525-54ef-4f9d-a6d3-909d601cc3f4',
    subscribe_key : 'sub-c-2885c358-da26-11e3-bf22-02ee2ddab7fe',
    uuid: assignUniqueUserID()
  });

  // Subscribe to channel
  initSubscribe();
}

function initSubscribe(){
  callStackReporter('initSubscribe()');
  RPSapp.pubNub.subscribe({
    channel : RPSapp.channelID,
    connect : checkCurrentChannel(),
    callback: function(msgCB){
      channelSubscriptionMsgHandler(msgCB)
    }
  });
}

function handleIncomingMessages(msgCB){
  callStackReporter('handleIncomingMessages()');
  console.log(msgCB)
}

// Create unique ID for this client user
function assignUniqueUserID() {
  callStackReporter('assignUniqueUserID()');

  // Retrieve from Localstorage first
  var localID = localStorage.getItem("RPSuuid");

  // console.log(localID);

  // If there is an ID
  if( localID !== "" &&
      localID !== undefined &&
      localID !== null ) {

        // Assign it to app runtime
        RPSapp.thisUserID = localID;
      } else {

          // Create one and assign it to app runtime
          localStorage.setItem("RPSuuid", PUBNUB.uuid());
          RPSapp.thisUserID = PUBNUB.uuid();
      }

  return RPSapp.thisUserID;
}

// Build new user tempalte and inject
function injectUser(userId) {

  // Basic User Setup with ID injected
  var externalUserTemplate = "<li data-role=externalUser id='" + userId + "'><div class='rock'>" +
  "<h1>USER " + userId + "</h1><img src='/images/rps-rock.png'/></div><div class='paper'>" +
  "<h1>USER " + userId + "</h1><img src='/images/rps-paper.png'/></div><div class='scissors'>" +
  "<h1>USER " + userId + "</h1><img src='/images/rps-scissors.png'/></div></li>";

  // Add user with the ID
  RPSapp.playerList.append(externalUserTemplate);

  // Set a simple local name reference for ease of access
  RPSapp.injectedUsers.push(userId);

  // Set up Name to DOM refence
  RPSapp.injectedUsersDictionary[userId] = $('#' + userId);
}

var extrainjection = false;

// Handle all messages
function channelSubscriptionMsgHandler(msg){

  if (msg.newUser && $('#' + msg.newUser).length === 0 ) {
    injectUser(msg.newUser);
  }

  // If a choice update message recieved
  // update the ID DOM
  if(msg.choiceUpdate) {
    console.log(msg.user + " says " + msg.choiceUpdate);

    console.log($(msg.user));

    if(extrainjection === false){
      extrainjection = true;
      injectUser(msg.user);
    }

    RPSapp.injectedUsersDictionary[msg.user].attr('class',msg.choiceUpdate);
  }

}

// Get the current state of the channel
function checkCurrentChannel() {
  callStackReporter('checkCurrentChannel()');

  // Ping Presence API
  RPSapp.pubNub.here_now({
    channel : RPSapp.channelID,
    callback : function receiver( message ) {
      handleOccupancyCount(message);
    }
  });
}

function handleOccupancyCount(message) {
  callStackReporter('handleOccupancyCount()');

  console.log(message);

  // If the room already has 2 players
  if( message.occupancy >= 2 ) {

    console.log('at least 2, goodbye')

    // Reset ID in storage nd start a new room
    assignUniqueUserID();
    window.location = window.location.origin;

    } else {

      console.log('less than 2, youre OK')

      // Populate DOM for connected users
      message.uuids.forEach(function(uuid){
        injectUser(uuid);
      });

      if($('#' + RPSapp.thisUserID).length === 0) {
        console.log('inject local dude')
        injectUser(RPSapp.thisUserID);

      }
  }
}

// Update the DOM based on player choice
function uiUpdater() {
  // callStackReporter('uiUpdater()');

  // Figure out which choice it is
  // Clear the classes and add approriate one
  // Publish the choice
  switch (RPSapp.playerChoice) {
  case 0:
    if (!RPSapp.injectedUsersDictionary[RPSapp.thisUserID].hasClass()) {
      RPSapp.injectedUsersDictionary[RPSapp.thisUserID].removeClass()
      playerChoiceUpdatePublish();
    }
    break;
  case 'rock':
    if (!RPSapp.injectedUsersDictionary[RPSapp.thisUserID].hasClass('rock')){
      RPSapp.injectedUsersDictionary[RPSapp.thisUserID].attr( "class", "rock" )
      playerChoiceUpdatePublish();
    }
    break;
  case 'paper':
    if (!RPSapp.injectedUsersDictionary[RPSapp.thisUserID].hasClass('paper')){
      RPSapp.injectedUsersDictionary[RPSapp.thisUserID].attr( "class", "paper" )
      playerChoiceUpdatePublish();
    }
    break;
  case 'scissors':
    if (!RPSapp.injectedUsersDictionary[RPSapp.thisUserID].hasClass('scissors')){
      RPSapp.injectedUsersDictionary[RPSapp.thisUserID].attr( "class", "scissors" )
      playerChoiceUpdatePublish();
    }
    break;
  }

}

// Read leap frame input
// Figure out what hand sign it is
function choiceDetector(frame){
  // callStackReporter('choiceDetector()');

  // If there is a hand present
  if(frame.hands.length > 0) {

      // Set fingerCount to current count of fingers
      RPSapp.fingerCount = frame.hands[0].fingers.length;

      // Set Rock Paper Scissors Status
      switch (RPSapp.fingerCount) {
      case 0:
        RPSapp.playerChoice = 'rock';
        break;
      case 5:
        RPSapp.playerChoice = 'paper';
        break;
      case 2:
        RPSapp.playerChoice = 'scissors';
        break;
      }

      // Update UI
      uiUpdater();
  }

}

// For every frame
function initLeap() {
  callStackReporter('initLeap()');

  Leap.loop(function(frame){
    if (RPSapp.gameRunning === true) {
      choiceDetector(frame);
    }
  });
}

// Update this players choice on the channel
function playerChoiceUpdatePublish() {
  callStackReporter('playerChoiceUpdatePublish()');

  console.log('push message from:' + RPSapp.thisUserID)

  RPSapp.pubNub.publish({
    channel : RPSapp.channelID,
    message : {
      user: RPSapp.thisUserID,
      choiceUpdate: RPSapp.playerChoice,
      bodyMsg: "The challenger " + RPSapp.thisUserID + " chose " + RPSapp.playerChoice
    }
  });
}

// Create an ID for the game
function createGameId(){
  var rand = function() {
      return Math.random().toString(36).substr(2); // remove `0.`
  };
  var token = function() {
      return rand() + rand(); // to make it longer
  };
  window.location.hash = token();
  return token();
}

// For Testing only
function callStackReporter(funcName) {
  console.log(funcName);
}

// Fire the whole app
RPSapp.init();

// For Testing only
window.checkCurrentChannel = checkCurrentChannel;
window.RPSapp = RPSapp;
