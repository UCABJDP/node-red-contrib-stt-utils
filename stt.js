module.exports = function(RED) {
	//Require 
	const Deepspeech = require('deepspeech');
	
    function STT(config) {
        RED.nodes.createNode(this,config);
        let node = this;
		
		let Model = null;
		let Stream = null;
		let timeout = null;
		
		//console.log(config);
		
		//Attempt to create Model, and Scorer if used, throw errors
		//Also add a note about filepaths if the errors matches the error an invalid filepath throws
		try {
			console.log("Model Enabled");
			Model = new Deepspeech.Model(config.model);
			
			if (config.beam !=""){
				Model.setBeamWidth(parseInt(config.beam));
			}
			
			console.log("Beam Width: "+Model.beamWidth());
			console.log("Sample Rate: "+Model.sampleRate());
		} catch (err){
			let filepathstatus = (err == "CreateModel failed: Failed to initialize memory mapped model. (0x3000)") ? " Please check model filepath.": ""
			node.error("Error: "+err+filepathstatus);
		}
		
		if ((config.scorer != "") && (Model != null)){
			console.log("Scorer Enabled");
			try {
				Model.enableExternalScorer(config.scorer);
			} catch (err){
				let filepathstatus = (err == "EnableExternalScorer failed: Invalid scorer file. (0x2002)") ? " Please check scorer filepath.": ""
				node.error("Error: "+err+filepathstatus);
			}	
		}
		
		if (!config.single){
			Stream = Model.createStream();
		}
		
		function pushSTT(){
			//Prep message, mark as decoding
			node.msg = {};
			node.status({fill:"green",shape:"dot",text:"Decoding"});
			
			//Decoding and refresh stream
			node.msg.payload = Stream.finishStream();
			Stream = Model.createStream();
			
			//Filter empty responses out, clear node status, and destroy timeout
			if (node.msg.payload != ""){node.send(node.msg);}
			node.status({});
			clearTimeout(timeout);
		}
	
        node.on('input', function(msg) {
			//Check input is a buffer, do not continue of it is not
			if(!Buffer.isBuffer(msg.payload)){node.error("Error: Input must be a buffer."); return;}
			if(Model == null){node.error("Error: Model not created, please check debug for initialisation errors."); return;}
			
			if (config.single){
				//Decode a single buffer, i.e. wav files etc
				node.msg = {};
				node.status({fill:"green",shape:"dot",text:"Decoding"});
				
				node.msg.payload = Model.stt(msg.payload);
				
				node.status({});
				node.send(node.msg);
			} else {
				//If the timeout has not yet been created or has been destroyed, create it, otherwise refresh it
				if((timeout == null) || (timeout._destroyed)){timeout = setTimeout(pushSTT, parseInt(config.timeout));}
				else {timeout.refresh();}
				
				//Mark the node as having data stored
				node.status({fill:"grey",shape:"dot",text:"Data Received"});
				Stream.feedAudioContent(msg.payload);
				
				if(msg.complete == true){
					pushSTT();
				}
			}
        });
		
		//Tidy up used resources before destroying stream
		node.on('close', function(){
			if (Model != null){
				Deepspeech.FreeModel(Model);
			}
			if (Stream != null){
				Deepspeech.FreeStream(Stream);
			}
		});
    }
	
    RED.nodes.registerType("stt",STT);
}