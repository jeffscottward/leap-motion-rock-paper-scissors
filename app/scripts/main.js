// Protect Global Namespace
// Execute Function Immediately
(function(){

  // Basic App setup
  var RPSapp = {};
      RPSapp.fingerCount;
      RPSapp.playerChoice;
      RPSapp.displayArea = {
        playerList: $('#player-list'),
        thisUser: $('#thisUser')
      }; // Temporary Display area
      RPSapp.pubNub; // PubNub API
      RPSapp.thisUserID;
      RPSapp.init = function (){
        initPubNub();
        initLeap();
      }

  // For Testing only
  function callStackReporter(funcName) {
    //console.log(funcName);
  }

  //Setup new PubNub Object c w/ auth Keys
  function initPubNub() {
    callStackReporter('initPubNub()');

    // Connect to Pubnub with AUTH keys
    // And a unique ID
    RPSapp.pubNub = PUBNUB.init({
      publish_key   : 'pub-c-d1d43525-54ef-4f9d-a6d3-909d601cc3f4',
      subscribe_key : 'sub-c-2885c358-da26-11e3-bf22-02ee2ddab7fe',
      uuid: assignUniqueID()
    });

    RPSapp.pubNub.subscribe({
      channel : "RPSchannel",
      message : function(msg) {

        var newUserID = msg.newUser;
        var user = msg.user;
        var choiceUpdate = msg.choiceUpdate;

        if (newUserID) {

          var externalUserTemplate = "<li data-role=externalUser id='" + newUserID + "'><div class='rock'>" +
          "<h1>USER " + newUserID + "</h1><img src='/images/rps-rock.png'/></div><div class='paper'>" +
          "<h1>USER " + newUserID + "</h1><img src='/images/rps-paper.png'/></div><div class='scissors'>" +
          "<h1>USER " + newUserID + "</h1><img src='/images/rps-scissors.png'/></div></li>";
          RPSapp.displayArea.playerList.append(externalUserTemplate);

        }

        if(choiceUpdate) {
          $('#' + user).attr('class',choiceUpdate);
        }

      },
      connect : onChannelJoin()
    });

  }

  // Create unique ID for this client user
  function assignUniqueID() {
    callStackReporter('assignUniqueID()');
    RPSapp.thisUserID = PUBNUB.uuid();
    return RPSapp.thisUserID;
  }

  // On initial connection push a message
  // To broadcast a user joining
  function onChannelJoin() {
    callStackReporter('onChannelJoin()');

    // Broadcast a new user has joined
    RPSapp.pubNub.publish({
      channel : "RPSchannel",
      message : {
        newUser: RPSapp.thisUserID,
        bodyMsg: "The challenger " + RPSapp.thisUserID + " appears! Get ready to fight!"
      }
    });
  }

  // Update this players choice on the channel
  function playerChoiceUpdate() {
    callStackReporter('playerChoiceUpdate()');

    RPSapp.pubNub.publish({
      channel : "RPSchannel",
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

    RPSapp.pubNub.here_now({
      channel : 'RPSchannel',
      callback : function(msg){console.log(msg)}
    });
  }

  // Update the DOM
  function uiUpdater() {
    callStackReporter('uiUpdater()');

    // Figure out which choice it is
    // Clear the classes and add approriate one
    // Publish the choice
    switch (RPSapp.playerChoice) {
    case 0:
      if (RPSapp.displayArea.thisUser.hasClass()) {
        RPSapp.displayArea.thisUser.removeClass()
      }
      break;
    case 'rock':
      if (!RPSapp.displayArea.thisUser.hasClass('rock')){
        RPSapp.displayArea.thisUser.attr( "class", "rock" )
        playerChoiceUpdate();
      }
      break;
    case 'paper':
      if (!RPSapp.displayArea.thisUser.hasClass('paper')){
        RPSapp.displayArea.thisUser.attr( "class", "paper" )
        playerChoiceUpdate();
      }
      break;
    case 'scissors':
      if (!RPSapp.displayArea.thisUser.hasClass('scissors')){
        RPSapp.displayArea.thisUser.attr( "class", "scissors" )
        playerChoiceUpdate();
      }
      break;
    }

  }

  // Read leap frame input
  // Figure out what hand sign it is
  function choiceDetector(frame){
    callStackReporter('choiceDetector()');

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
    callStackReporter('choiceDetector()');

    Leap.loop(function(frame){
        choiceDetector(frame);
    });
  }

  // Fire the whole app
  RPSapp.init();

  // For Testing only
  window.getCurrentChannelStatus = getCurrentChannelStatus;

})();
