module.exports = function(RED) {
	"use strict";
	
	//Require 
	const PCM = require('pcm-format');
	const {Readable} = require('stream');
	
	const configMap = {"true": true, "false": false};
	
    function pcmFormat(config) {
        RED.nodes.createNode(this,config);
        let node = this;
		
		//Stream allow incoming messages to be piped into the decoder
		let inputStream = new Readable({
			read(size) {}
		});
		
		//Set up converter and pipe
		let converter = new PCM({float: configMap[config.input], signed: configMap[config.insigned], bitDepth: parseInt(config.inbitdepth)},
		{float: configMap[config.output], signed: configMap[config.outsigned], bitDepth: parseInt(config.outbitdepth)});
		
		//console.log(converter.inFormat);
		//console.log(converter.outFormat);
		
		inputStream.pipe(converter);
		converter.on("data", function(data){
			node.msg = {};
			node.msg.payload = data;
			//console.log("OUT:");
			//console.log(data);
			node.send(node.msg);
		});
	
        node.on('input', function(msg) {
			//Check input is a buffer, do not continue of it is not
			if(!Buffer.isBuffer(msg.payload)){node.error("Error: Input must be a buffer."); return;}
			
			//console.log("IN:");
			//console.log(msg.payload);
			inputStream.push(msg.payload);
        });
    }
	
    RED.nodes.registerType("pcm-format",pcmFormat);
}