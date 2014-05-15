// Protect Global Namespace
// Execute Function Immediately
(function(){

  // Setup new PubNub Object c w/ auth Keys
  // var pubnub = PUBNUB.init({
  //   publish_key   : 'pub-c-d1d43525-54ef-4f9d-a6d3-909d601cc3f4',
  //   subscribe_key : 'sub-c-2885c358-da26-11e3-bf22-02ee2ddab7fe'
  // });
  //
  // // Set up this environment's client subscriber instance
  // pubnub.subscribe({
  //   channel : "RPSchannel",
  //   message : function(msg) {
  //     console.log(msg)
  //   },
  //   connect : publish
  // });
  //
  // // Function to push a a message
  // function publish() {
  //   pubnub.publish({
  //     channel : "RPSchannel",
  //     message : "A challenger appears! Get ready to fight!"
  //   });
  // }

  var RPSapp = {};
      RPSapp.fingerCount;
      RPSapp.playerChoice;
      RPSapp.jumbotron = $('.jumbotron');

  // For every frame
  Leap.loop(function(frame){

      // If there is a hand present
      if(frame.hands.length > 0) {

          // Set fingerCount to current count of fingers
          RPSapp.fingerCount = frame.hands[0].fingers.length;

          // Set Rock Paper Scissors Status
          switch (RPSapp.fingerCount) {
            case 0:
              console.log('ROCK!')
              RPSapp.playerChoice = 1;
              break;
            case 5:
              console.log('PAPER!')
              RPSapp.playerChoice = 2;
              break;
            case 2:
              console.log('SCISSORS!')
              RPSapp.playerChoice = 3;
              break;
          }
      }

      if ( RPSapp.playerChoice === 1 && !RPSapp.jumbotron.hasClass('rock') ) {
        !RPSapp.jumbotron.toggleClass('rock');

        !RPSapp.jumbotron.removeClass('paper');
        !RPSapp.jumbotron.removeClass('scissors');
      }

      if ( RPSapp.playerChoice === 2 && !RPSapp.jumbotron.hasClass('paper') ) {
        !RPSapp.jumbotron.toggleClass('paper');

        !RPSapp.jumbotron.removeClass('rock');
        !RPSapp.jumbotron.removeClass('scissors');
      }

      if ( RPSapp.playerChoice === 3 && !RPSapp.jumbotron.hasClass('scissors') ) {
        !RPSapp.jumbotron.toggleClass('scissors');

        !RPSapp.jumbotron.removeClass('rock');
        !RPSapp.jumbotron.removeClass('paper');
      }



      // publish();

      //         pubnub.publish({
      //           channel : "hello_world",
      //           message : "Someones hand was found"
      //         });

  });


})();
