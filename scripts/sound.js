var ctx = new AudioContext();
var bufferLoader = new BufferLoader(
    ctx,
    [
      "sounds/AAcyclrun.wav",
      "sounds/AAexpl.wav"
    ]
);
bufferLoader.load();



var cycleSounds = ctx.createGain();
cycleSounds.panner = ctx.createPanner();
cycleSounds.panner.panningModel = "equalpower" // "HRTF" realism, "equalpower" performance

cycleSounds.connect(cycleSounds.panner);
cycleSounds.panner.connect(ctx.destination);



var playSound = function(buffer, vol, pitch, loop) {
    var src = ctx.createBufferSource();
    src.gainNode = ctx.createGain();

    src.connect(src.gainNode);
    src.gainNode.connect(cycleSounds);

    src.buffer = buffer;
    src.gainNode.gain.value = vol;
    src.playbackRate.value = pitch;
    src.loop = loop;
    
    src.start(ctx.currentTime);

    return src;
};



// function makeDistortionCurve(amount) {
//   var k = typeof amount === 'number' ? amount : 50,
//     n_samples = 44100,
//     curve = new Float32Array(n_samples),
//     deg = Math.PI / 180,
//     i = 0,
//     x;
//   for ( ; i < n_samples; ++i ) {
//     x = i * 2 / n_samples - 1;
//     curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
//   }
//   return curve;
// };

// var oscillator = function(osctype, vol, pitch){

//  var osc = ctx.createOscillator();
//  var gainNode = ctx.createGain();
//  var distortion = ctx.createWaveShaper();
//    distortion.curve = makeDistortionCurve(200);
//    distortion.oversample = '4x';

//  osc.type = osctype;
//  osc.frequency.value = pitch;
//  osc.connect(cycleSounds);

//  distortion.connect(cycleSounds);
  
//  gainNode.connect(ctx.destination);
//  gainNode.gain.value = vol;

//  osc.start();

//  return {
//    osc: osc,
//    gainNode: gainNode
//  };
// };


var engineSound;
var engineSound2;
var engineOsc
var explosionSound;
var turnSound;



// var awesomeSaucesomeTurnSound = function() {
//     var turnOsc = oscillator('sawtooth', 0.15, ((dir+1)/lastDir)*500);
//     var turnOsc2 = oscillator('sawtooth', 0.15, (((dir/lastDir)+2)/2)*500);
//     turnOsc.osc.stop(ctx.currentTime+0.05);
//     turnOsc2.osc.stop(ctx.currentTime+0.05);
// }