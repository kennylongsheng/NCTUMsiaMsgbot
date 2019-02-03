'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json()); // Creates express http server
const request = require('request');
const fs = require('fs');
const assert = require('assert');
const mongoClient = require('mongodb').MongoClient;

// SETUP ENV CONFIG : https://devcenter.heroku.com/articles/config-vars#managing-config-vars
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const KennyPSID = process.env.KENNYPSID;
const MlabURI = process.env.MLABURI;
const HELP_PTR = fs.readFileSync('txt/help.txt','utf8')

//////////////////////////////////SETUP WEBHOOK--Don't Change//////////////////////////////////////////////////
app.listen(process.env.PORT || 9482 ,() => console.log('webhook is listening'));

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
				console.log(Sender_ID + '-> send a text message');
				distinguishMSG(Sender_ID,Message);
			}
			else if(webhook_event.message&&webhook_event.message.attachments[0]) // Received Attachement
			{
				let Message = "You've Sent An Attachment\nType \"help\" to check Instruction.";
				console.log(Sender_ID + ' send an ' + webhook_event.message.attachments[0].type);
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
	let Query_Type_Correct = true;

	// PRIORITY :  number > insert > request > help
	// number <Name>
	if(Message_Input.includes("number")){ 
		let queryNameString = {name : { $regex: / + Message_Array[Message_Array.indexOf("number") + 1] + /i} };
		//console.log(queryNameString);
		//console.log(typeof(queryNameString));
		//let queryName = JSON.parse(queryNameString); 
		queryDB(Sender_ID, queryNameString, sendAPI);
		//let msg_ADD = queryDB(Sender_ID, queryName);
		//console.log("Return->" + queryDB(Sender_ID, queryName));
		//console.log("Value From Function Return -> " + msg_ADD);
		//Message_Input = queryName +" : \n" + msg_ADD;
	} 
	// insert <Course> <Year> <Name> <PhoneNo.>
	else if (Message_Input.includes("insert")){ 
		let queryCourse = Message_Array[Message_Array.indexOf("insert") + 1];
		let queryYear = Message_Array[Message_Array.indexOf("insert") + 2];
		let queryName = Message_Array[Message_Array.indexOf("insert") + 3];
		let queryPhone = Message_Array[Message_Array.indexOf("insert") + 4];
		// Check Query Error 
		if(isNaN(Number(queryYear)) || isNaN(Number(queryPhone))){ // queryYear and queryPhone will become NaN when convert to number
			Query_Type_Correct = false;
		}
		else{
			insertDB(queryCourse, queryYear, queryName, queryPhone); // Insert Document to DB
			Message_Input = "Insert -> " + queryCourse + " " + queryYear + " " + queryName + " " + queryPhone;
		}
	}
	else if(Message_Array.length == 1 && Message_Array[0] === "request"){
		sendAPI(KennyPSID,"Someone Request!");
		Message_Input = "Request Sent! Please Wait For Approval.";
	}
	else if(Message_Input.includes("help")){
		Message_Input = HELP_PTR;
	}
	else{
		Query_Type_Correct = false;
	}
	// console.log("Message Final Reply-> " + Message_Input);

	// Check Query Error
	if(Query_Type_Correct == false){ // || Message_Input.includes("undefined")
		Message_Input = "Query Error!\nType \"help\" to check Instruction.";
		Query_Type_Correct = true;
	}
	sendAPI(Sender_ID, Message_Input);
}

//////////////////////////////////CONNECT DB//////////////////////////////////////////////////
// mlab base address: "mongodb://<USERNAME>:<PASSWORD>@ds147421.mlab.com:47421/nctumycommunity"
let insertDB = function(qcourse, qyear, qname, qphoneno){
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
};

let queryDB = function(Sender_ID, qname, send){
	mongoClient.connect(MlabURI, { useNewUrlParser: true }, function(err,client){
		assert.equal(null, err);

		const db = client.db("nctumycommunity");
		console.log(typeof(qname));
		console.log(qname);
		let cursor = db.collection('info').find(qname).sort({couser: 1, year: 1}); // "{ $regex: /" +qname+"/ }"
		
		cursor.forEach(function(doc){
			let message = doc.course+" "+doc.year+" "+doc.name+" "+doc.phoneno;
			console.log("Result in Query Function ->" + message);
			send(Sender_ID, message);
			console.log(JSON.stringify(doc));
			// console.log("Result in Query Function ->" + JSON.stringify(message));
			// console.log("Result in Query Function ->" + typeof(message));
			// return (JSON.stringify(message));
			//sendAPI(Sender_ID, message);
		},
		function(err){/*console.log(err);*/});
	});
};