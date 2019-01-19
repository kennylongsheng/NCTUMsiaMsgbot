'use strict';

// Imports dependencies and set up http server
const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json()); // Creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 9482 ,() => console.log('webhook is listening'));

// Creates the endpoint for our webhook
app.post('/webhook', (req,res) => {
	let body = req.body;
	
	// Check this is an event from a page subscription
	if (body.object === 'page'){
		// Iterates over each entry - there may be multiple if batched
		body.entry.forEach(function(entry){
			//Gets the message. entry.messaging is an array, but 
			//will only ever contain one message, so we get index 0
			let webhook_event = entry.messaging[0];
			console.log(webhook_event);
		});
		// Return a '200 OK' respond to all request
		res.status(200).send('EVENT_RECEIVED')
	}
	else {
	// Returns a '404 Not Found' if event is not from a page subscription
	res.sendStatus(404);
	}
});

// Adds support for GET request to our webhook
app.get('/webhook',(req,res)=>{
	// Your verify token. Should be a random string.
	let VERIFY_TOKEN = "<kennybuildnctufbbot>";
	const PAGE_ACCESS_TOKEN = "EAAE7iV7ts1ABAFxxAAkqKNhQrlWpTZCNUKbslt5i79t3yZABOJmTD9OUS4vm20jjVmeOv8MxZArW5azSYBdpzZCkc5qDkEN7OvRBKFnTZB4motteC0ZCOa2BKPm1d1RZBax6oE0wek8NBixZCWOcDjfeiZAOfOK7E16blZCf5OklZCuHwZDZD";
	//process.env.PAGE_ACCESS_TOKEN;


	// Parse the query params
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];

	// Checks if a token and mode is in the query string of the request
	if(mode && token){
		// Check the mode and token sent is correct
		if (mode === 'subscribe' && token === VERIFY_TOKEN){
			// Responds with the challenge token from the request
			console.log('WEBHOOK_VERIFIED');
			res.status(200).send(challenge);
		}
		else{
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);
		}
	}
});