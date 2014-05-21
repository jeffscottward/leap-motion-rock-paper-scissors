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
      getCurrentChannelStatus();
      initLeap();
      // roundOverDetection();
    }

// TODO: Replace Clock w/ TimeStamp via Presence API
// http://www.pubnub.com/docs/javascript/overview/presence.html#_using_presence_api

// On initial connection push a message
// To broadcast a user joining
function onChannelJoin() {
  callStackReporter('onChannelJoin()');

  // Broadcast a new user has joined
  RPSapp.pubNub.publish({
    channel : RPSapp.channelID,
    message : {
      newUser: RPSapp.thisUserID,
      bodyMsg: "The challenger " + RPSapp.thisUserID + " appears! Get ready to fight!"
    }
  });

  console.log( RPSapp.thisUserID + ' has joined ' + RPSapp.channelID );

  injectUser(RPSapp.thisUserID);
}

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
  RPSapp.pubNub.subscribe({
    channel : RPSapp.channelID,
    presence: function(presence){
      // console.log("presence: "); console.dir(presence)
    },
    message : function(msg){channelSubscriptionMsgHandler(msg)},
    connect : onChannelJoin()
  });
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
  var externalUserTemplate = "<li data-role=externalUser id='" + userId + "'><div class='rock'>" +
  "<h1>USER " + userId + "</h1><img src='/images/rps-rock.png'/></div><div class='paper'>" +
  "<h1>USER " + userId + "</h1><img src='/images/rps-paper.png'/></div><div class='scissors'>" +
  "<h1>USER " + userId + "</h1><img src='/images/rps-scissors.png'/></div></li>";
  RPSapp.playerList.append(externalUserTemplate);
  RPSapp.injectedUsers.push(userId);
  RPSapp.injectedUsersDictionary[userId] = $('#' + userId);
}

// Handle all messages
function channelSubscriptionMsgHandler(msg){

  var newUserID = msg.newUser;
  var userID = msg.user;
  var choiceUpdate = msg.choiceUpdate;

  if (msg.newUser) {
      for(var i = 0; i < RPSapp.injectedUsers.length; i++) {
        if(newUserID !== RPSapp.injectedUsers[i]) {
          i++;
          injectUser(newUserID);
        }
      }
  }

  // If a choice update message recieved
  // update the ID DOM
  if(choiceUpdate) {
    console.log(choiceUpdate);

    RPSapp.injectedUsersDictionary[userID].attr('class',choiceUpdate);
  }

}

// Update this players choice on the channel
function playerChoiceUpdate() {
  callStackReporter('playerChoiceUpdate()');

  RPSapp.pubNub.publish({
    channel : RPSapp.channelID,
    message : {
      user: RPSapp.thisUserID,
      choiceUpdate: RPSapp.playerChoice,
      bodyMsg: "The challenger " + RPSapp.thisUserID + " chose " + RPSapp.playerChoice
    }
  });
}

// Get the current state of the channel
function getCurrentChannelStatus() {
  callStackReporter('getCurrentChannelStatus()');

  // Ping Presence API
  RPSapp.pubNub.here_now({
    channel : RPSapp.channelID,
    callback : function receiver( message ) {

      // If the room already has 2 players
      if( message.occupancy >= 2 ) {

        // Reset ID in storage nd start a new room
        assignUniqueUserID();
        window.location = window.location.origin;
      } else {

        // Populate DOM for connected users
        message.uuids.forEach(function(uuid){
          injectUser(uuid);
        });

      }
    }
  });
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
    }
    break;
  case 'rock':
    if (!RPSapp.injectedUsersDictionary[RPSapp.thisUserID].hasClass('rock')){
      RPSapp.injectedUsersDictionary[RPSapp.thisUserID].attr( "class", "rock" )
      playerChoiceUpdate();
    }
    break;
  case 'paper':
    if (!RPSapp.injectedUsersDictionary[RPSapp.thisUserID].hasClass('paper')){
      RPSapp.injectedUsersDictionary[RPSapp.thisUserID].attr( "class", "paper" )
      playerChoiceUpdate();
    }
    break;
  case 'scissors':
    if (!RPSapp.injectedUsersDictionary[RPSapp.thisUserID].hasClass('scissors')){
      RPSapp.injectedUsersDictionary[RPSapp.thisUserID].attr( "class", "scissors" )
      playerChoiceUpdate();
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

  // If there is NOT a hand present
  } else {
    RPSapp.playerChoice = 0;
    uiUpdater();
  }

}

// For every frame
function initLeap() {
  callStackReporter('initLeap()');

  Leap.loop(function(frame){
    if (RPSapp.gameRunning === true) {
      choiceDetector(frame);
      // updateGlobalTimer();
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

// TODO: Clock
// Start the clock
function roundOverDetection(){
  callStackReporter('initClock');

  RPSapp.gameRunning = false;
  console.log('Round Over! You chose ' + RPSapp.playerChoice + '!');
}

// Publish to channel the time
function updateGlobalTimer() {
  callStackReporter('updateGlobalTimer');
}

// For Testing only
function callStackReporter(funcName) {
  console.log(funcName);
}

// Fire the whole app
RPSapp.init();

// For Testing only
window.getCurrentChannelStatus = getCurrentChannelStatus;
window.RPSapp = RPSapp;
