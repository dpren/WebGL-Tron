var ctx = new AudioContext();
var bufferLoader = new BufferLoader(
    ctx,
    [
      "sounds/CLcyclrun.wav",
      "sounds/CLexpl.wav",
      "sounds/energy.mp3",
      "sounds/morph.mp3"
    ]
);
bufferLoader.load();



var cycleSounds = ctx.createGain();
cycleSounds.gain.value = 1;
cycleSounds.panner = ctx.createPanner();
cycleSounds.panner.panningModel = "equalpower"; // "HRTF" realism, "equalpower" performance

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



var engineSound;
var explosionSound;
var turnSound;
var bounceSound;
var morphSound;
