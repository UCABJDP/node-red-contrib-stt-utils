module.exports = function(RED) {
	"use strict";
	
	//Require 
	const {Readable} = require('stream');
	const VAD = require('node-vad');
	
	//Map Config to VAD.Mode
	const modemap = {"Normal": VAD.Mode.NORMAL, "LowBitrate": VAD.Mode.LOW_BITRATE, "Aggressive": VAD.Mode.AGGRESSIVE, "VeryAggressive": VAD.Mode.VERY_AGGRESSIVE};
	
    function NodeRedVad(config) {
        RED.nodes.createNode(this,config);
        let node = this;
		
		//Create VAD Stream
		const vadStream = VAD.createStream({
			mode: modemap[config.mode],
			audioFrequency: parseInt(config.samplerate),
			debounceTime: parseInt(config.debounce)
		});
		
		//Create space for timeout
		let timeout = null;
		
		//Create Input Stream
		const inputStream = new Readable({
			read(size) {}
		});
		
        node.on('input', function(msg) {
			//Check input is a buffer, do not continue of it is not
			if(!Buffer.isBuffer(msg.payload)){node.error("Error: Input must be a buffer."); return;}
			inputStream.push(msg.payload);
        });
		
		function pushTimeout(){
			node.status({});
				
			node.msg.payload = Buffer.alloc(0);
			node.msg.complete = true;
			node.send(node.msg);
		}
		
		inputStream.pipe(vadStream).on("data",function(data){
			//Create empty message to place audiodata in
			node.msg = {};
			
			if(data.speech.start || data.speech.state){
				node.status({fill:"grey",shape:"dot",text:"Utterance Ongoing"});
				
				if(config.timeout != ""){
					//Timeout
					if((timeout == null) || (timeout._destroyed)){timeout = setTimeout(pushTimeout, parseInt(config.timeout));}
					else {timeout.refresh();}
				}
				
				node.msg.payload = data.audioData;
				node.send(node.msg);
			} else if (data.speech.end) {
				node.status({});
				
				clearTimeout(timeout);
				
				node.msg.payload = data.audioData;
				node.msg.complete = true;
				node.send(node.msg);
			}
		});

    }
	
    RED.nodes.registerType("node-vad",NodeRedVad);
}