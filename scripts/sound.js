// Detect if the audio context is supported.
window.AudioContext = (
  window.AudioContext ||
  window.webkitAudioContext ||
  null
);

if (!AudioContext) {
  throw new Error("AudioContext not supported!");
} 




  var ctx = new AudioContext();


  var mainVolume = ctx.createGain();

  mainVolume.connect(ctx.destination);



  var sound = {};
  sound.source = ctx.createBufferSource();
  sound.volume = ctx.createGain();
  sound.panner = ctx.createPanner();

  sound.source.connect(sound.volume);


  sound.volume.connect(sound.panner);
  sound.panner.connect(mainVolume);





var cyclerun = {};

var playCycleEngine = function() {

  cyclerun.source = ctx.createBufferSource();
  cyclerun.volume = ctx.createGain();
  cyclerun.volume.gain.value = 0.6;
  cyclerun.panner = ctx.createPanner();

  cyclerun.source.connect(cyclerun.volume);

  cyclerun.volume.connect(cyclerun.panner);
  cyclerun.panner.connect(mainVolume);

  cyclerun.source.loop = true;


  var request3 = new XMLHttpRequest();
  request3.open("GET", "sounds/cyclrun.wav", true);
  request3.responseType = "arraybuffer";
  request3.onload = function(e) {

    
    ctx.decodeAudioData(this.response, function onSuccess(buffer) {
      cyclerun.buffer = buffer;

      
      cyclerun.source.buffer = cyclerun.buffer;
      cyclerun.source.start(ctx.currentTime);

    }, function onFailure() {
      alert("Decoding the audio buffer failed");
    });
  };

  request3.send();
};




var explosion = {};

var playExplosion = function() {

  //var explosion = {};
  explosion.source = ctx.createBufferSource();
  explosion.volume = ctx.createGain();
  explosion.panner = ctx.createPanner();

  explosion.source.connect(explosion.volume);


  explosion.volume.connect(explosion.panner);
  explosion.panner.connect(mainVolume);




  var request2 = new XMLHttpRequest();
  request2.open("GET", "sounds/expl.wav", true);
  request2.responseType = "arraybuffer";
  request2.onload = function(e) {

    // Create a buffer from the response ArrayBuffer.
    ctx.decodeAudioData(this.response, function onSuccess(buffer) {
      explosion.buffer = buffer;

      // Make the sound source use the buffer and start playing it.
      explosion.source.buffer = explosion.buffer;
      explosion.source.start(ctx.currentTime);
      explosion.source.stop(ctx.currentTime + 1000);

    }, function onFailure() {
      alert("Decoding the audio buffer failed");
    });
  };

  request2.send();
};
