// ANSI color codes used by 'style'.
var colors = {
	black: 0, red: 1, green: 2, yellow: 3, blue: 4, magenta: 5, cyan: 6, white: 7
};

var DEFAULT_LEAD_IN = style(" <", {color: 'blue'});
var DEFAULT_LEAD_OUT = style(" >", {color: 'magenta'});

/**
 * Provides means of outputting buffers in a two column layout with hex bytes on the left and
 * the ascii character on the right.
 *
 * e.g.
 *
 *     var log = new Displayer();
 *     log.inMsg("Hello");
 *     log.in(myReceivedBuffer);
 *     log.out(mySendingBuffer);
 */
function Displayer() {
	// bytes to display per line.
	this.lineLength = 20;

	// bytes and characters get buffered until they reach the end of a line or .flush is called.
	this.lineBytes = [];
	this.lineTxt = [];

	// lines can be displayed with a prefix, e.g. < or > indicating in or out buffers.
	this.lastPrefix = " ";
}

Displayer.prototype.writeByte = function(linePrefix, byte) {
	if (linePrefix !== this.lastPrefix) {
		this.flush();
	}

	this.lastPrefix = linePrefix;
	this.lineBytes.push(formatByte(byte));

	if (byte <= 0x1f || (byte >= 0x80 && byte <= 0x9f)) {
		this.lineTxt.push(style(".", {color: "yellow"}));
	} else {
		this.lineTxt.push(new Buffer([byte]).toString('utf8'));
	}

	if (this.lineBytes.length >= this.lineLength) {
		this.flush();
	}
};

Displayer.prototype.flush = function() {
	if (this.lineBytes.length === 0) return;
	var byteDisplay = pad(this.lineBytes.join(" "), this.lineLength * 3, " ");
	console.log(this.lastPrefix + " "
			+ style(byteDisplay, {background: 'cyan'})
			+ " : "
			+ this.lineTxt.join(""));
	this.lineBytes.length = 0;
	this.lineTxt.length = 0;
};

/*
 * Writes an entire buffer with a specified prefix.  Will flush at the end.
 */
Displayer.prototype.writeBuffer = function(linePrefix, buffer) {
	for (var i = 0; i < buffer.length; ++i) {
		this.writeByte(linePrefix, buffer[i]);
	}
	this.flush();
};

Displayer.prototype.in = function(buffer) {
	this.writeBuffer(DEFAULT_LEAD_IN, buffer);
};
Displayer.prototype.inMsg = function(msg) {
	console.log(DEFAULT_LEAD_IN + " " + msg);
};
Displayer.prototype.out = function(buffer) {
	this.writeBuffer(DEFAULT_LEAD_OUT, buffer);
};
Displayer.prototype.outMsg = function(msg) {
	console.log(DEFAULT_LEAD_OUT + " " + msg);
};

module.exports = Displayer;

// pads a string to a particular length by adding to the end.
function pad(string, length, padStr) {
	length = length || 2;
	padStr = padStr || " ";
	while (string.length < length) {
		string = string + padStr;
	}
	return string;
}

// returns the two digit hex code for a byte.
function formatByte(byte) {
	var str = "0" + byte.toString(16);
	str = str.substring(str.length - 2);
	return str;
}

// styles a string with ansi codes according to a passed style description.
function style(str, style) {
	var startCodes = [];
	var endCodes = [];
	for (var key in style) {
		if (key === 'color' || key === 'background') {
			var base = (key === 'color' ? 30 : 40);
			var styleParts = style[key].split(" ");
			var color = styleParts[styleParts.length - 1];
			var isBright = false;
			if (styleParts[0] === 'bright') {
				isBright = true;
			}
			startCodes.push("\x1B[" + (base + colors[color]) + (isBright ? ";1m" : "m"));
			endCodes.push("\x1B[" + (base + 9) + (isBright ? ";22m" : "m"))
		}
		// maybe add some of the other ansi styles in future.
	}
	return startCodes.join("") + str + endCodes.reverse().join("");
}