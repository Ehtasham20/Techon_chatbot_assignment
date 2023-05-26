const express = require("express");
const rp = require("request-promise-native");
const ngrok = require("ngrok");
require('dotenv').config()

const app = express();

app.use(express.json());

const INSTANCE_URL = process.env.INSTANCE_URL;
const PRODUCT_ID = process.env.PRODUCT_ID;
const PHONE_ID = process.env.PHONE_ID;
const API_TOKEN = process.env.API_TOKEN;

if (!PRODUCT_ID || !PHONE_ID || !API_TOKEN)
  throw Error(
    "You need to change PRODUCT_ID, PHONE_ID and API_KEY values in app.js file."
  );

async function send_message(body) {
  let url = `${INSTANCE_URL}/${PRODUCT_ID}/${PHONE_ID}/sendMessage`;
  let response = await rp(url, {
    method: "post",
    json: true,
    body,
    headers: {
      "Content-Type": "application/json",
      "x-maytapi-key": API_TOKEN,
    },
  });
  return response;
}

async function setup_network() {
  let public_url = await ngrok.connect(3000);
  let webhook_url = `${public_url}/webhook`;
  let url = `${INSTANCE_URL}/${PRODUCT_ID}/setWebhook`;
  let response = await rp(url, {
    method: "POST",
    body: { webhook: webhook_url },
    headers: {
      "x-maytapi-key": API_TOKEN,
      "Content-Type": "application/json",
    },
    json: true,
  });
  console.log(response)
}

// Define a route for the API
app.get("/", (req, res) => res.send("Hello World!"));

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  let { message, user } = req.body;
  let bot_message = {
    type: "",
    message: "",
    to_number: "",
  };
  if (message && message.text) {
    if (
      message.text.toLowerCase().includes("hi") ||
      message.text.toLowerCase().includes("hey") ||
      message.text.toLowerCase().includes("hello")
    ) {
	  bot_message.type = 'buttons'
      bot_message.message = `Hi, welcome to TechOn. How may we help you today?`;
      bot_message.to_number = user.phone;
	  bot_message['buttons'] = [
		{
			"id": 'customer_support',
			"text": 'Customer Support'
		},
		{
			"id": 'sales',
			"text": 'Sales'
		}
	  ]
      send_message(bot_message);
    }

	else if (
		message.text.toLowerCase().includes("customer support")
	  ) {

		await send_message({type: 'text', message: `we'll connect you to support shortly.`, to_number: user.phone});
		bot_message.type = 'buttons'
		bot_message.message =  `Is there anything else I can do for you?`;
		bot_message.to_number = user.phone;
		bot_message['buttons'] = [
		  {
			  "id": 'yes',
			  "text": 'Yes'
		  },
		  {
			  "id": 'no',
			  "text": 'No'
		  }
		]
		send_message(bot_message);
	  }

	else if (
		message.text.toLowerCase().includes("sales")
	  ) {
		
		await send_message({type: 'text', message: `Sales will reach out to you.`, to_number: user.phone});
		bot_message.type = 'buttons'
		bot_message.message =  `Is there anything else I can do for you?`;
		bot_message.to_number = user.phone;
		bot_message['buttons'] = [
		  {
			  "id": 'yes',
			  "text": 'Yes'
		  },
		  {
			  "id": 'no',
			  "text": 'No'
		  }
		]
		send_message(bot_message);
	  }

	  else if (
		message.text.toLowerCase().includes("yes")
	  ) {
		send_message({type: 'text', message: `please type your query.`, to_number: user.phone});
	  }

	  else if (
		message.text.toLowerCase().includes("no")
	  ) {
		send_message({type: 'text', message: `Thanks for your time.`, to_number: user.phone});
	  } else {
		bot_message.type = 'text'
		bot_message.message = `we'll connect you shortly.`;
		bot_message.to_number = user.phone;
		send_message(bot_message)
	  }
  }
});

// Start the server
const port = 3000; // Change it to your preferred port number
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await setup_network();
});
