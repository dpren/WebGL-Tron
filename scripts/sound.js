var ctx = new AudioContext();
var bufferLoader = new BufferLoader(
    ctx,
    [
      "sounds/radb.m4a",
      "sounds/AAexpl.wav",
      "sounds/energy.mp3",
      "sounds/morph.mp3",
      "sounds/CLcyclrun.wav"
    ]
);
bufferLoader.load();



// cycle.audio = ctx.createGain();
// cycle.audio.gain.value = 1;

// cycle.audio.panner = ctx.createPanner();
// cycle.audio.panner.panningModel = "equalpower";

// cycle.audio.connect(cycle.audio.panner);
// cycle.audio.panner.connect(ctx.destination);



var playSound = function(buffer, vol, pitch, loop, output) {
    
    var src = ctx.createBufferSource();
    src.gainNode = ctx.createGain();

    src.connect(src.gainNode);
    src.gainNode.connect(output);

    src.buffer = buffer;
    src.gainNode.gain.value = vol;
    src.playbackRate.value = pitch;
    src.loop = loop;
    
    src.start(ctx.currentTime);

    return src;
};



// var engineSound;
// var explosionSound;
// var turnSound;
// var bounceSound;
// var morphSound;
