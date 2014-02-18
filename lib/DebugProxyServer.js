var net = require('net');
var Displayer = require('./Displayer');
var log = new Displayer();

/**
 * Creates a proxy listening on proxyPort that will connect to remoteServer:remotePort
 * if it receives any connections.  All traffic will be forwarded.
 *
 * To begin, you will need to call 'start'.
 *
 * @param remoteServer the server to connect to.
 * @param remotePort the port on the remote server to connect to.
 * @param proxyPort the port to listen on for connections.
 * @constructor
 */
function DebugProxyServer(remoteServer, remotePort, proxyPort) {
	this.remoteServer = remoteServer;
	this.remotePort = remotePort;
	this.proxyPort = proxyPort;
}

/**
 * Start listening on the proxyPort for connections.
 */
DebugProxyServer.prototype.start = function(callback) {
	var remotePort = this.remotePort;
	var remoteServer = this.remoteServer;
	var proxyPort = this.proxyPort;

	this.proxy = net.createServer(function(incoming) {
		log.inMsg('Incoming connection from ' + incoming.remoteAddress);

		var outgoing = new net.Socket();

		incoming.on('data', function(data) {
			log.in(data);
		});
		incoming.on('end', function() {
			log.inMsg('Incoming connection disconnected.');
		});
		incoming.on('error', function(event) {
			log.inMsg('Error from incoming connection : ' + event.code);
			outgoing.end();
		});

		outgoing.on('connect', function() {
			log.outMsg('Outbound connection to '+ remoteServer + ":" + remotePort + " established.");
		});
		outgoing.on('data', function(data) {
			log.out(data);
		});
		outgoing.on('error', function(event) {
			log.outMsg('Error from outgoing connection : ', event.code);
			incoming.end();
		});

		outgoing.connect(remotePort, remoteServer);
		outgoing.pipe(incoming);
		incoming.pipe(outgoing);
	});

	this.proxy.listen(proxyPort, function() {
		if (callback) {
			callback(this.proxy.address().port);
		}
	}.bind(this));
};

module.exports = DebugProxyServer;