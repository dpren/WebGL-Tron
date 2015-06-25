var ctx = new AudioContext();
var bufferLoader = new BufferLoader(
    ctx,
    [
     "sounds/eng1.m4a",
     "sounds/eng2.m4a",
     "sounds/eng3.wav",
     "sounds/eng4.wav",
     "sounds/eng5.wav",
     "sounds/crash1.wav",
     "sounds/rubberHit.mp3",
     "sounds/wallCollapse.mp3",
     "sounds/crash1.wav",
    ]
    );
bufferLoader.load();




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