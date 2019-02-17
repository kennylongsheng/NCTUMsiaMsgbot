'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json()); // Creates express http server
const request = require('request');
const fs = require('fs');
const assert = require('assert');
const mongoClient = require('mongodb').MongoClient;
const queue = require('queue');
const path = require('path');

// SETUP ENV CONFIG : https://devcenter.heroku.com/articles/config-vars#managing-config-vars
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const KennyPSID = process.env.KENNYPSID;
const MlabURI = process.env.MLABURI;
const HELP_PTR = fs.readFileSync('adminPage/help.txt','utf8');
var msgPar = queue();

//////////////////////////////////SETUP WEBHOOK--Don't Change//////////////////////////////////////////////////
app.listen(process.env.PORT || 9482 ,() => console.log(`webhook is listening`));

app.get('/webhook',(req,res)=>{
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];

	if(mode && token){
		if (mode === 'subscribe' && token === VERIFY_TOKEN){
			//console.log('WEBHOOK_VERIFIED');
			res.status(200).send(challenge);
		}
		else{
			res.sendStatus(403);
		}
	}
});

//////////////////////////////////Send Admin Page--Don't Change//////////////////////////////////////////////////
// path prefix part ref to : https://www.tutorialspoint.com/expressjs/expressjs_static_files.htm
app.use('/admin',express.static('adminPage'));

//////////////////////////////////Receive Message Data--Don't Change//////////////////////////////////////////////////
app.post('/webhook', (req,res) => {
	let body = req.body;
	if (body.object === 'page'){ // PAGE_ID = 235798233272453
		body.entry.forEach(function(entry) // Iterates over each entry - there may be multiple if batched
		{
			let webhook_event = entry.messaging[0];
			let Sender_ID = webhook_event.sender.id;
			if(webhook_event.message&&webhook_event.message.text) // Received Text
			{
				let Message = webhook_event.message.text.toLowerCase();
				console.log(`${Sender_ID} -> send a text message`);
				queryIdentity({"PSID" : Sender_ID});
				distinguishMSG(Sender_ID,Message);
			}
			else if(webhook_event.message&&webhook_event.message.attachments[0]) // Received Attachement
			{
				let Message = `You've Sent An Attachment\nType \"help\" to check Instruction.`;
				console.log(`${Sender_ID} send an ${webhook_event.message.attachments[0].type}`);
				sendAPI(Sender_ID, Message);
			}
			else // PostBack Things Check
			{
				//console.log(webhook_event);				
			}
		});
		res.status(200).send('EVENT_RECEIVED');
	}
	else {
	res.sendStatus(404);
	}
});

//////////////////////////////////Send API--Don't Change//////////////////////////////////////////////////
// send API refer to : https://www.youtube.com/watch?v=eLevk-c8Xwc&t=1192s
let sendAPI = function(Sender_ID, Send_Message){
	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs : {access_token : PAGE_ACCESS_TOKEN},
		method: "POST",
		json:{
			recipient: {id: Sender_ID},
			message : {text: Send_Message},
		}
	},
	function(err,res,body){
		//if(err){console.log('Sending Error');}
		//else if(res.body.err){console.log('Respond Body Error');}
	})
};
//////////////////////////////////Message Distinguish//////////////////////////////////////////////////
let distinguishMSG = function(Sender_ID, Message_Input){
	let Message_Array = Message_Input.split(" ");

	// PRIORITY :  number > insert > request > help
	// number <Name>
	if(Message_Input.includes("number")){ 
		if(Message_Array[Message_Array.indexOf("number") + 1] === "all")
		{
			queryDB(null, Sender_ID, sendAPI);
		}
		else
		{
			let queryNameString = {name : { $regex: ( Message_Array[Message_Array.indexOf("number") + 1] )} }; // "{ $regex: /" +qname+"/ }"
			queryDB(queryNameString, Sender_ID, sendAPI);
		}
	} 
	// insert <Course> <Year> <Name> <PhoneNo.>
	else if (Message_Input.includes("insert")){ 
		let queryCourse = Message_Array[Message_Array.indexOf("insert") + 1];
		let queryYear = Message_Array[Message_Array.indexOf("insert") + 2];
		let queryName = Message_Array[Message_Array.indexOf("insert") + 3];
		let queryPhone = Message_Array[Message_Array.indexOf("insert") + 4];
		// Check Query Error 
		if(isNaN(Number(queryYear)) || isNaN(Number(queryPhone))){ // queryYear and queryPhone will become NaN when convert to number
			sendAPI(Sender_ID, `Query Error!\nType \"help\" to check Instruction.`);
		}
		else{
			insertDB(queryCourse, queryYear, queryName, queryPhone, Sender_ID, sendAPI); // Insert Document to DB
		}
	}
	// request
	else if(Message_Array.length == 1 && Message_Array[0] === "request"){
		sendAPI(KennyPSID, `${Sender_ID} Request!`);
		sendAPI(Sender_ID, `Request Sent! Please Wait For Approval.`);
	}
	//help
	else if(Message_Input.includes("help")){
		sendAPI(Sender_ID,HELP_PTR);
	}
	else{
		sendAPI(Sender_ID, `Query Error!\nType \"help\" to check Instruction.`);
	}
}

//////////////////////////////////CONNECT DB//////////////////////////////////////////////////
// mlab base address: "mongodb://<USERNAME>:<PASSWORD>@ds147421.mlab.com:47421/nctumycommunity"
let insertDB = function(qcourse, qyear, qname, qphoneno, Sender_ID, send){
	mongoClient.connect(MlabURI,{ useNewUrlParser: true }, function(err,client){
		assert.equal(null, err);

		const db = client.db("nctumycommunity");
		db.collection('info').insertOne({
			"course": qcourse,
			"year": qyear,
			"name": qname,
			"phoneno": qphoneno
		});
		client.close();
	})
	let messageParser = `Database Insert-> ${qcourse} ${qyear} ${qname} ${qphoneno}`;
	send(Sender_ID, messageParser);
};

let queryDB = function(qname, Sender_ID, send){
	mongoClient.connect(MlabURI, { useNewUrlParser: true }, function(err,client){
		assert.equal(null, err);

		const db = client.db("nctumycommunity");
		let cursor = db.collection('info').find(qname).sort({course: 1, year: 1}); 
		cursor.forEach(function(doc){
			let message = `${doc.course} ${doc.year} ${doc.name} ${doc.phoneno}\n`;
			msgPar.push(message)	
			// console.log(`${JSON.stringify(doc)} \n ${typeof(doc)}`);
		},
		function(err){/*console.log(err);*/});
		setTimeout(function(){
			let message = ""
			for(let i = msgPar.length ; i != 0 ; i--)
			{
				message = msgPar.pop() + message;
			}
			//console.log(`Message Check -> ${message}`); //Final Check Message
			send(Sender_ID, message);
		}, 1000);
	});
};
let queryIdentity = function(query){
	mongoClient.connect(MlabURI, { useNewUrlParser: true }, function(err,client){
		assert.equal(null, err);

		client.db("nctumycommunity").collection('whitelist').find(query,function(err, result){
			if(err){console.log(err)};
			if(!result.length){;}
			else{
				result.forEach(function(doc){
					console.log(JSON.stringify(doc));
				})
			}
		});
	});
};