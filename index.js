'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json()); // Creates express http server

const VERIFY_TOKEN = "<kennybuildnctufbbot>";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

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

//////////////////////////////////WEBHOOKDEPLOYED//////////////////////////////////////////////////

app.post('/webhook', (req,res) => {
	let body = req.body;
	//console.log(body);
	if (body.object === 'page'){
		// Iterates over each entry - there may be multiple if batched
		body.entry.forEach(function(entry){
			//let webhook_event = entry.messaging[0];
			//console.log(webhook_event); //PAGE_ID = 235798233272453
			let Sender_ID = entry.messaging[0].sender.id;
			let Time_Stamp = entry.messaging[0].timestamp;
			let Message = entry.messaging[0].message.text;
			if(entry.messaging[0].message.text)
			{
				console.log(Sender_ID + ' send a text message on ' + Time_Stamp)
				console.log(Message)
				console.log('_____________________________')
			}
			else if(entry.messaging[0].message.attachments[0])
			{
				console.log(Sender_ID + ' send an attachment on ' + Time_Stamp);
			}
			else
			{
				console.log(Sender_ID + 'send : ' + entry.messaging[0].message)
			}
		});
		res.status(200).send('EVENT_RECEIVED')
	}
	else {
	res.sendStatus(404);
	}
});
