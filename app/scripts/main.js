// Protect Global Namespace
// Execute Function Immediately
(function(){

  var RPSapp = {};
      RPSapp.fingerCount;
      RPSapp.playerChoice;
      RPSapp.jumbotron = $('.jumbotron');
      RPSapp.pubNub;
      RPSapp.thisUser;
      RPSapp.init = function (){
        initPubNub();
        subscribeToPubNubChannel();
        assignUniqueID();
        getCurrentChannelStatus();
        initLeap();
      }

  //Setup new PubNub Object c w/ auth Keys
  function initPubNub() {
    RPSapp.pubNub = PUBNUB.init({
      publish_key   : 'pub-c-d1d43525-54ef-4f9d-a6d3-909d601cc3f4',
      subscribe_key : 'sub-c-2885c358-da26-11e3-bf22-02ee2ddab7fe'
    });
  }

  // Subscribe to channel and broadcast you have done so
  function subscribeToPubNubChannel() {
    RPSapp.pubNub.subscribe({
      channel : "RPSchannel",
      message : function(msg) {console.log(msg)},
      connect : onChannelJoin()
    });
  }

  // Create unique ID for this client user
  function assignUniqueID() {
    RPSapp.thisUser = RPSapp.pubNub.uuid();
  }

  // On initial connection push a message
  // To broadcast a user joining
  function onChannelJoin() {

    assignUniqueID();

    RPSapp.pubNub.publish({
      channel : "RPSchannel",
      message : "The challenger " + RPSapp.thisUser + " appears! Get ready to fight!"
    });
  }

  // Update this players choice on the channel
  function playerChoiceUpdate() {
    RPSapp.pubNub.publish({
      channel : "RPSchannel",
      message : "The challenger " + RPSapp.thisUser + " chose " + RPSapp.playerChoice
    });

  }

  // Get the current state of the channel
  function getCurrentChannelStatus() {
    RPSapp.pubNub.here_now({
      channel : 'RPSchannel',
      callback : function(m){console.log(m)}
    });
  }

  // For every frame
  function initLeap() {
    Leap.loop(function(frame){

        // If there is a hand present
        if(frame.hands.length > 0) {

            // Set fingerCount to current count of fingers
            RPSapp.fingerCount = frame.hands[0].fingers.length;

            // Set Rock Paper Scissors Status
            switch (RPSapp.fingerCount) {
              case 0:
                RPSapp.playerChoice = 'ROCK!';
                break;
              case 5:
                RPSapp.playerChoice = 'PAPER!';
                break;
              case 2:
                RPSapp.playerChoice = 'SCISSORS!';
                break;
            }
        }

        if ( RPSapp.playerChoice === 'ROCK!' && !RPSapp.jumbotron.hasClass('rock') ) {

          RPSapp.jumbotron.toggleClass('rock');

          RPSapp.jumbotron.removeClass('paper');
          RPSapp.jumbotron.removeClass('scissors');

          playerChoiceUpdate();
        }

        if ( RPSapp.playerChoice === 'PAPER!' && !RPSapp.jumbotron.hasClass('paper') ) {
          RPSapp.jumbotron.toggleClass('paper');

          RPSapp.jumbotron.removeClass('rock');
          RPSapp.jumbotron.removeClass('scissors');

          playerChoiceUpdate();
        }

        if ( RPSapp.playerChoice === 'SCISSORS!' && !RPSapp.jumbotron.hasClass('scissors') ) {
          RPSapp.jumbotron.toggleClass('scissors');

          RPSapp.jumbotron.removeClass('rock');
          RPSapp.jumbotron.removeClass('paper');

          playerChoiceUpdate();
        }

    });
  }

  // Fire the whole app
  RPSapp.init();

  // For Testing only
  window.getCurrentChannelStatus = getCurrentChannelStatus;

})();
