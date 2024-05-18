const http = require('http');
const httpSuccessStatus = 200;
const fs = require("fs");
const express = require("express");
const app = express(); 
const bodyParser = require("body-parser");
const path = require("path");
const portNumber = process.argv[2];
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
require("dotenv").config({path: path.resolve(__dirname, 'credentialsDontPost/.env')});
const { MongoClient, ServerApiVersion } = require('mongodb');
const alert = require('alert'); 

const password = process.env.MONGO_DB_PASSWORD;
const user = process.env.MONGO_DB_USERNAME;
const batabase= process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;

const databaseAndCollection = {db: batabase, collection: collection};
const uri = `mongodb+srv://${user}:${password}@cluster0.chsbeau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const notifier = require('node-notifier');

const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		serverApi: ServerApiVersion.v1,
	
})
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(__dirname + "/css"));


app.get("/", (request, response) => {
	response.render("index");
});

app.get("/newCourse", (request, response) => {
    response.render("newCourse")
});

app.get("/back", (request, response) => {
    response.render("newCourse")
});


app.post("/processNewCourse", async (request, response) => {
	const {name, num, gpa, type, credit} = request.body;
	let state = "fail"
	if(gpa>=1.7){
		state = "pass"
	}

	let data = {
		name: name.toUpperCase(),
		num: num,
		gpa: gpa,
		type: type,
		credit: credit,
		state: state,
	};
    
	    try {
		    await insertData(client, databaseAndCollection, data);
		    response.render("processNewCourse", data);
	    } catch (e) {
         console.error(e);
        } finally {
            await client.close();
        }
})

function myFunction() {

    notifier.notify({
        title: 'Error',
        message: 'You enter wrong course name',
        icon: path.join(__dirname, 'icon.jpg'),
        sound: true,
        wait: true
      },
    )
    // console.log("Hello! I am an alert box!")
    // prompt("Hello! I am an alert box!");
  }

async function insertData(client, databaseAndCollection, data) {
	await client.connect();	
	const result = await client
			.db(databaseAndCollection.db)
			.collection(databaseAndCollection.collection)
			.insertOne(data)
}

app.get("/tableList", async (request, response) => {
    try{
        let filter = {};
		// const cursor = await client
  		// 	.db(databaseAndCollection.db)
   		// 	.collection(databaseAndCollection.collection)
        //     .find(filter);
		const result = await lookUpData(client, databaseAndCollection, filter);
		let ULCtable = LLRtable = ULRtable = Elective = COREtable = FStable = DStable = IStable = Diversity = "<table border = 1> <tr><th>Name</th><th>Number</th><th>GPA</th><th>State</th><th>Credit</th><tr>";

		for(let element of result){
			if(element.type == "ULC"){
				ULCtable += "<tr><td>" + element.name + "</td><td>" + element.num + "</td><td>" + element.gpa + "</td><td>" + element.credit + "</td><td>" + element.state + "</td></tr>"
			} 
			else if(element.type == "LLR"){
				LLRtable += "<tr><td>" + element.name + "</td><td>" + element.num + "</td><td>" + element.gpa + "</td><td>" + element.credit + "</td><td>" + element.state + "</td></tr>"
			}
			else if(element.type == "ULR"){
				ULRtable += "<tr><td>" + element.name + "</td><td>" + element.num + "</td><td>" + element.gpa + "</td><td>" + element.credit + "</td><td>" + element.state + "</td></tr>"
			}
			else if(element.type == "Electives"){
				Elective += "<tr><td>" + element.name + "</td><td>" + element.num + "</td><td>" + element.gpa + "</td><td>" + element.credit + "</td><td>" + element.state + "</td></tr>"
			}
			else if(element.type == "FS"){
				FStable += "<tr><td>" + element.name + "</td><td>" + element.num + "</td><td>" + element.gpa + "</td><td>" + element.credit + "</td><td>" + element.state + "</td></tr>"
			}
			else if(element.type == "DS"){
				DStable += "<tr><td>" + element.name + "</td><td>" + element.num + "</td><td>" + element.gpa + "</td><td>" + element.credit + "</td><td>" + element.state + "</td></tr>"
			}
			else if(element.type == "IS"){
				IStable += "<tr><td>" + element.name + "</td><td>" + element.num + "</td><td>" + element.gpa + "</td><td>" + element.credit + "</td><td>" + element.state + "</td></tr>"
			}
			else{
				Diversity += "<tr><td>" + element.name + "</td><td>" + element.num + "</td><td>" + element.gpa + "</td><td>" + element.credit + "</td><td>" + element.state + "</td></tr>"
			}
		}
		ULCtable += "</table>";
		LLRtable += "</table>";
		ULRtable += "</table>";
		Elective += "</table>";
		FStable += "</table>";
		DStable += "</table>";
		IStable += "</table>";
		Diversity += "</table>";
		response.render("tableList", {ULCtable, LLRtable, ULRtable, Elective, FStable, DStable, IStable, Diversity});
	} catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
})

async function lookUpData(client, databaseAndCollection, filter){
	await client.connect();
   	const cursor = await client
  			.db(databaseAndCollection.db)
   			.collection(databaseAndCollection.collection)
   			.find(filter);
	const result = await cursor.toArray();
	console.log(result);

	return result;
}

app.get("/check", async (request, response) => {
	let total = 0.0;
	let totalCredits = 0;
	let answer = "";
	let check = true;
	let ULCCheck = LLRCheck = ULRCheck = electiveCheck = GenCheck = 0;
	try{
        let filter = {};
		const result = await lookUpData(client, databaseAndCollection, filter);
		for(let element of result){
			if(element.state == "pass"){
				totalCredits += parseInt(element.credit);
				if(element.type == "ULC"){
					ULCCheck += parseInt(parseInt(element.credit));
				} 
				else if(element.type == "LLR" && (element.name == "MATH" && (element.num == "141" || element.num == "140" || element.num == "241" 
				|| element.num == "240")) || (element.name == "STAT") || (element.name == "CMSC" && (element.num == "131" || element.num == "132"
				|| element.num == "250" || element.num == "216" || element.num == "335" || element.num == "351"))){
					LLRCheck += parseInt(element.credit);
				}
				else if(element.type == "ULR"){
					ULRCheck += parseInt(element.credit);
				}
				else if(element.type == "Electives"){
					electiveCheck += parseInt(element.credit);
				}
				else{
					GenCheck += parseInt(element.credit);
				}
			}
			total += parseFloat(element.gpa);
		}
		answer += "You current total credit is " + totalCredits + "<br>";
		if(ULCCheck < 12){
			answer += "The Upper Level Concentration need to have 12 credits, but you only have " + ULCCheck + "<br>";
			check = false;
		} 
		if(LLRCheck < 37){
			answer += "The Lower Level Requirements need to have 37 credits, but you only have " + LLRCheck + "<br>";
			check = false;
		}
		if(ULRCheck < 15){
			answer += "The Upper Level Requirements need to have 15 credits, but you only have " + ULRCheck + "<br>";
			check = false;
		}
		if(electiveCheck < 6){
			answer += "The Electives need to have 6 credits, but you only have " + electiveCheck + "<br>";
			check = false;
		}
		if(GenCheck < 40){
			answer += "The General Education Required Credits need more 40 credits, but you only have " + GenCheck + "<br>";
			check = false;
		}
		let avgGPA = total / result.length;
		if(avgGPA < 2.1) {
			answer += "Your average credit should be 2.1, but your only have " + avgGPA + " right now <br>"
		}
		if(check){
			answer += "The satisfy every requirement you can graduate right now";
		}
		response.render("check", {answer});
	} catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
	// response.render("check", result)
})

app.get("/remove", (request, response) => {
	response.render("remove")
})

app.post("/processRemove", async (request, response) => {
	try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        // console.log(`Deleted documents ${result.deletedCount}`);
		response.render("processRemove", {num : result.deletedCount});
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
})



if(process.argv.length != 3) {
	console.error("Usage summerCampServer.js portNumber");
	process.exit(1);
}

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
const text = "Type stop to shutdown the server: ";
process.stdout.write(text);
process.stdin.setEncoding("utf-8");
process.stdin.on('readable', () => {
    const dataInput = process.stdin.read();
    if (dataInput !== null) {
		const command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0);  /* exiting */
        } 
		else {
			/* After invalid command, we cannot type anything else */
			console.log(`Invalid command: ${command}`);
		}
		process.stdout.write(text);
		process.stdin.resume();
    }
})