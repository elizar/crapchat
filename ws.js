var net = require('net');
var crypto = require('crypto');
var sockets = [];
var wsp = require('./wsp');
var server = net.createServer(function(socket) {
			if (sockets.indexOf(socket) === -1) {
				sockets.push(socket);
				console.log("socket added");
			}

			socket.on('end close', function(s) {
				delete sockets[sockets.indexOf(s)];
			});

			socket.on('error', console.log);
			socket.on("data", function(d) {
				console.log(d[0]);
				if (d[0] === 136) {
						delete sockets[sockets.indexOf(socket)];
				}
				if (d.toString().indexOf("Sec-WebSocket-Key") === -1) {
					var txt = wsp.parse(d);
					sockets.forEach(function(s) {
						s.write(new Buffer(wsp.encode(s.localAddress + ' says: ' + txt)));
					});
					return;
				}
				var handShakeArray = d.toString().split('\r\n'),
						handShake = {};
				handShakeArray.forEach(function(text) {
					if (text !== 'GET / HTTP/1.1' && text !== '') {
						var textArray = text.split(':');
						handShake[textArray[0]] = textArray[1].trim();
					}
				});
				var swa = crypto.createHash('sha1').update(handShake['Sec-WebSocket-Key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64'),
						response	= 'HTTP/1.1 101 Switching Protocols\r\n';
						response += 'Upgrade: websocket\r\n';
						response += 'Connection: Upgrade\r\n';
						response += 'Sec-WebSocket-Accept: '+swa+'\r\n';
						response += 'Sec-WebSocket-Protocol: chat\r\n';
						response += '\r\n';
						this.write(response, 'ascii');
			});
		})
		.listen(1337);

// Setup webserver
var webserver = require('http').createServer(web);
		webserver.listen(3000);
function web(req, res) {
	res.writeHead(200, {'Content-Type':'text/html'});
	res.end(require('fs').readFileSync('./chat.html'));
}
