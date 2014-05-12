// Protect Global Namespace
// Execute Function Immediately
(function(){

  // Setup new PubNub Object c w/ auth Keys
  var pubnub = PUBNUB.init({
    publish_key   : 'pub-c-d1d43525-54ef-4f9d-a6d3-909d601cc3f4',
    subscribe_key : 'sub-c-2885c358-da26-11e3-bf22-02ee2ddab7fe'
  });

  // Set up this environment's client subscriber instance
  pubnub.subscribe({
    channel : "hello_world",
    message : function(msg) {
      console.log(msg)
    },
    connect : publish
  });

  // Function to push a a message
  function publish() {
    pubnub.publish({
      channel : "hello_world",
      message : "a client is present! woot!"
    });
  }

  // Leap test
  //  controller.use('handEntry');
  Leap.loop(function(frame){})
      .use('handEntry')
      .on('handFound', function(hand){
        pubnub.publish({
          channel : "hello_world",
          message : "Someones hand was found"
        });
      });
})();
