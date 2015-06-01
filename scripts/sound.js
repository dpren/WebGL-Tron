var ctx = new AudioContext();
var bufferLoader = new BufferLoader(
    ctx,
    [
      "sounds/eng2.m4a",
      "sounds/crash1.wav",
      "sounds/rubberHit.mp3",
      "sounds/wallCollapse.mp3",
      "sounds/eng3.wav"
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

