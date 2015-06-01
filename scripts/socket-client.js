var socket = io();

socket.on('userupdate', function (data) {
    //document.querySelector('#numUsers').innerHTML = data;
});



socket.on('turn_left', function (data) {
    
    turnLeft( cycle );
});

socket.on('turn_right', function (data) {
    
    turnRight( cycle );
});

socket.on('crash', function (data) {
    
    crash( cycle );
});

