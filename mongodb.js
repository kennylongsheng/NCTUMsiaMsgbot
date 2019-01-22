const mongo = require('mongodb');

var mongoClient = mongo.MongoClient;
var url = "mongodb://localhost:27017/mydb";

mongoClient.connect(url,function(err,db){
	if(err) throw err;
	console.log("DB created!");
	db.close();
})