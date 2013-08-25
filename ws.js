var net = require('net');
var wsp = require('./wsp');
var sockets = [];
var server = net.createServer(function(socket) {
    if (sockets.indexOf(socket) === -1) {
        socket.nick = Date.now().toString();
        sockets.push(socket);
    }

    socket.on('end', function(s) {
        console.log(sockets.indexOf(socket));
        var deleted = sockets.splice(sockets.indexOf(socket), 1);
        if (deleted.length > 0) {
            sockets.forEach(function(s) {
                s.write(new Buffer(wsp.encode('[-Server Notice-] ' + socket.nick + ' disconnected from server')));
            });
            console.log('Socket deleted');
        }
    });

    socket.on('error', console.log);

    socket.on('data', function(d) {
        if (d.toString().indexOf('Sec-WebSocket-Key') === -1) {
            if (d[0] === 136) {
                // if this is close frame exit this shit
                socket.end();
                return;
            }
            var txt = wsp.parse(d);
            var isNickChanged = false,
                oldNick = socket.nick;
            if (txt.indexOf('/nick ') !== -1) {
                // if change of nick is present
                var at = txt.split(' ');
                socket.nick = at[1];
                socket.write(new Buffer(wsp.encode('You are now known as ' + at[1])));
                isNickChanged = true;
            }
            sockets.forEach(function(s) {
                if (s.writable) {
                    if (isNickChanged) {
                        if (s !== socket)
                            s.write(new Buffer(wsp.encode('[-Server Notice-] ' + oldNick + ' is now known as ' + socket.nick)));
                    } else
                        s.write(new Buffer(wsp.encode(socket.nick + ' says: ' + txt)));
                } else {
                    // end socket if it's not writable
                    // this is a fix of chrome's not sending close frame issue
                    s.end();
                }
            });
            return;
        }
        // Handle handshake from client
        var response = wsp.handshake(d);
        this.write(response);

    });

});
server.listen(1337, function() {
    console.log('Server running on port 3000');
});

// our webserver
var webserver = require('http').createServer(web);
webserver.listen(3000);

function web(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.end(require('fs').readFileSync('./chat.html'));
}
