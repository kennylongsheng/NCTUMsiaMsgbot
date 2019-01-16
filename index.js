'use strict';

// Imports dependencies and set up http server
const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json()); // Creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 9482 ,() => console.log('webhook is listening'));
