var net = require('net');
var sockets = [];
var wsp = require('./wsp');
var server = net.createServer(function(socket) {
			if (sockets.indexOf(socket) === -1) {
				sockets.push(socket);
			}

			socket.on('end close', function(s) {
				sockets.splice(sockets.indexOf(s), 1);
			});

			socket.on('error', console.log);

			socket.on('data', function(d) {
				console.log(d[0]);
				if (d.toString().indexOf('Sec-WebSocket-Key') === -1) {
					
					var txt = wsp.parse(d);
					sockets.forEach(function(s) {
						if (s.writable) {
							s.write(new Buffer(wsp.encode(s.localAddress + ' says: ' + txt)));
						} else {
							// delete sockets if it's no longer writable
							// this seems to fix google chromes weird socket issue
							// when the client closes the browser it never sends any
							// close frame
							sockets.splice(sockets.indexOf(s), 1);
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
	res.writeHead(200, {'Content-Type':'text/html'});
	res.end(require('fs').readFileSync('./chat.html'));
}
