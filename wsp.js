var crypto = require('crypto');

exports.parse = function(d) {
	var datalength = d[1] & 127;
	var indexFirstMask = 2;
	if (datalength == 126) {
		indexFirstMask = 4;
	} else if (datalength == 127) {
		indexFirstMask = 10;
	}
	var masks = d.slice(indexFirstMask,indexFirstMask + 4);
	var i = indexFirstMask + 4;
	var index = 0;
	var output = "";
	while (i < d.length) {
		output += String.fromCharCode(d[i++] ^ masks[index++ % 4]);
	}
	return output;
};

exports.encode = function(d) {
	var bytesFormatted = [];
	bytesFormatted[0] = 129;
	if (d.length <= 125) {
		bytesFormatted[1] = d.length;
	} else if (d.length >= 126 && d.length <= 65535) {
		bytesFormatted[1] = 126;
		bytesFormatted[2] = ( d.length >> 8 ) & 255;
		bytesFormatted[3] = ( d.length      ) & 255;
	} else {
		bytesFormatted[1] = 127;
		bytesFormatted[2] = ( d.length >> 56 ) & 255;
		bytesFormatted[3] = ( d.length >> 48 ) & 255;
		bytesFormatted[4] = ( d.length >> 40 ) & 255;
		bytesFormatted[5] = ( d.length >> 32 ) & 255;
		bytesFormatted[6] = ( d.length >> 24 ) & 255;
		bytesFormatted[7] = ( d.length >> 16 ) & 255;
		bytesFormatted[8] = ( d.length >>  8 ) & 255;
		bytesFormatted[9] = ( d.length       ) & 255;
	}
	for (var i = 0; i < d.length; i++){
		bytesFormatted.push(d.charCodeAt(i));
	}
	return bytesFormatted;
};

exports.handshake = function(d) {
	var headers = d.toString().split('\r\n'),
			parsedHeaders = {};
	headers.forEach(function(text) {
		if (text !== 'GET / HTTP/1.1' && text !== '') {
			var textArray = text.split(':');
			parsedHeaders[textArray[0]] = textArray[1].trim();
		}
	});
	var swa = crypto.createHash('sha1')
						.update(parsedHeaders['Sec-WebSocket-Key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
						.digest('base64');
	var response	= 'HTTP/1.1 101 Switching Protocols\r\n';
			response += 'Upgrade: websocket\r\n';
			response += 'Connection: Upgrade\r\n';
			response += 'Sec-WebSocket-Accept: '+swa+'\r\n';
			response += 'Sec-WebSocket-Protocol: chat\r\n';
			response += '\r\n';
	return response;
};