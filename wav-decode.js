module.exports = function(RED) {
	"use strict";
	
	//Require 
	const wav = require('wav');
	const {Readable} = require('stream');
	
    function wavDecode(config) {
        RED.nodes.createNode(this,config);
        let node = this;
			
		//Create spot for the decode to go
		let wavReader = null;
		
		//Stream allow incoming messages to be piped into the decoder
		let inputStream = new Readable({
			read(size) {}
		});
	
        node.on('input', function(msg) {
			node.msg = {};
			wavReader = new wav.Reader();
			let eventCount = 0;
			
			//Check input is a buffer, do not continue of it is not
			if(!Buffer.isBuffer(msg.payload)){node.error("Error: Input must be a buffer."); return;}
			
			//Simple way of going "wait until both events have triggered before sending the message"
			wavReader.on("data",function(data){
				node.msg.payload = data;
				if (eventCount){node.send(node.msg);}
				eventCount++;
			});
			wavReader.on("format",function(data){
				node.msg.format = data;
				if (eventCount){node.send(node.msg);}
				eventCount++;
			});
			wavReader.on("error",function(err){
				node.error("Error: "+err);
				return;
			});
			
			//Reconnect pipes and push data into input buffer
			inputStream.pipe(wavReader);
			inputStream.push(msg.payload);
        });
    }
	
    RED.nodes.registerType("wav-decode",wavDecode);
}