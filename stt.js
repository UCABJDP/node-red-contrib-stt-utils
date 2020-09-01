module.exports = function(RED) {
	//Require 
	const Deepspeech = require('deepspeech');
	
    function STT(config) {
        RED.nodes.createNode(this,config);
        let node = this;
		
		//Filepaths: TODO: Config options
		let modelPath = "C:/Users/Joshua Pimm/Desktop/IoT Bear/node-red-contrib-local-stt-utils/deepspeech-0.8.0-models.pbmm";
		let scorerPath = "C:/Users/Joshua Pimm/Desktop/IoT Bear/node-red-contrib-local-stt-utils/deepspeech-0.8.0-models.scorer";
		
		let Model = new Deepspeech.Model(modelPath);
		Model.enableExternalScorer(scorerPath);
		
		//TODO: Vary beam width
		console.log("Beam Width: "+Model.beamWidth());
		
		let Stream = Model.createStream();
	
        node.on('input', function(msg) {
			//Check input is a buffer, do not continue of it is not
			if(!Buffer.isBuffer(msg.payload)){node.error("Error: Input must be a buffer."); return;}
			
			//TODO: Stream vs File, Timing / Debug information, Timeout
			
			//node.msg.payload = Model.stt(msg.payload);
			//node.send(node.msg);
			
			Stream.feedAudioContent(msg.payload);
			if(msg.complete == true){
				node.msg = {};
				node.msg.payload = Stream.finishStream();
				Stream = Model.createStream();
				if (node.msg.payload != ""){node.send(node.msg);}
			}
        });
		
		//Tidy up
		node.on('close', function(){
			Deepspeech.FreeModel(Model);
			if (typeof Stream !== "undefined"){
				Deepspeech.FreeStream(Stream);
			}
		});
    }
	
    RED.nodes.registerType("stt",STT);
}