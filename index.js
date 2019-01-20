'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json()); // Creates express http server
const request = require('request');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
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
	if (body.object === 'page'){
		// Iterates over each entry - there may be multiple if batched
		body.entry.forEach(function(entry)
		{
			let webhook_event = entry.messaging[0];
			console.log(webhook_event.message); //PAGE_ID = 235798233272453
			let Sender_ID = webhook_event.sender.id;
			let Time_Stamp = webhook_event.timestamp;
			let Message = webhook_event.message.text;
			if(webhook_event.message.text)
			{
				console.log(Sender_ID + ' send a text message on ' + Time_Stamp);
				//console.log(Message);
				sendText(Sender_ID, webhook_event);
			}
			else if(webhook_event.message.attachments[0])
			{
				console.log(Sender_ID + ' send an ' + webhook_event.message.attachments[0].type + ' on ' + Time_Stamp);
			}
			else
			{
				console.log(Sender_ID + 'send Something');
			}
		});
		res.status(200).send('EVENT_RECEIVED');
	}
	else {
	res.sendStatus(404);
	}
});

function sendText(Sender_ID, Send_Message){

	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs : {access_token : PAGE_ACCESS_TOKEN},
		method: "POST",
		json:{
			recipient: {id: Sender_ID},
			message : {text: Send_Message.message.text},
		}
	},
	function(err,res,body){
		console.log('________________________________________________________');
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

