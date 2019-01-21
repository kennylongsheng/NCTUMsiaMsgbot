'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json()); // Creates express http server
const request = require('request');
const fs = require('fs');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const HELP_PTR = fs.readFileSync('txt/help.txt','utf8')

//////////////////////////////////SETUP WEBHOOK--Don't Change//////////////////////////////////////////////////
app.listen(process.env.PORT || 9482 ,() => console.log('webhook is listening'));

app.get('/webhook',(req,res)=>{
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];

	if(mode && token){
		if (mode === 'subscribe' && token === VERIFY_TOKEN){
			console.log('WEBHOOK_VERIFIED');
			res.status(200).send(challenge);
		}
		else{
			res.sendStatus(403);
		}
	}
});

//////////////////////////////////Receive Message Data//////////////////////////////////////////////////

app.post('/webhook', (req,res) => {
	let body = req.body;
	if (body.object === 'page'){ // PAGE_ID = 235798233272453
		// Iterates over each entry - there may be multiple if batched
		body.entry.forEach(function(entry)
		{
			let webhook_event = entry.messaging[0];
			let Sender_ID = webhook_event.sender.id;
			// Received Text
			if(webhook_event.message&&webhook_event.message.text)
			{
				let Message = webhook_event.message.text.toLowerCase();
				console.log(Sender_ID + ' send a text message');
				//console.log(Message);
				//sendAPI(Sender_ID, Message);
				separateMsg(Sender_ID,Message);
			}
			// Received Attachement
			else if(webhook_event.message&&webhook_event.message.attachments[0])
			{
				console.log(Sender_ID + ' send an ' + webhook_event.message.attachments[0].type);
				let Message = "You've Sent An Attachment";
				sendAPI(Sender_ID, Message);
			}
			// POSTBACK Things
			else
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
function sendAPI(Sender_ID, Send_Message){

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
		if(err)
		{
			console.log('Sending Error');
		}
		else if(res.body.err)
		{
			console.log('Respond Body Error');
		}
	})
};

//////////////////////////////////Message Distinguish//////////////////////////////////////////////////
function separateMsg(Sender_ID, Message_Input){
	let Message_Array = Message_Input.split(" ");
	//console.log(Message_Array);

	// PRIORITY :  number > insert > help
	if(Message_Input.includes("number")){
		let queryName = Message_Array[Message_Array.indexOf("number") + 1];
		Message_Input = "Query Number of " + queryName;
	}
	else if (Message_Input.includes("insert")){
		let queryYear = Message_Array[Message_Array.indexOf("insert") + 1];
		let queryName = Message_Array[Message_Array.indexOf("insert") + 2];
		let queryPhone = Message_Array[Message_Array.indexOf("insert") + 3];
		Message_Input = "Insert Number of " + queryYear + queryName + queryPhone;
	}
	else if(Message_Input.includes("help")){
		Message_Input = HELP_PTR;
	}
	else{
		Message_Input = "Type \"help\" to check Instruction.中文可以顯示嗎？";
	}
	console.log(Message_Input);
	sendAPI(Sender_ID, Message_Input);
}