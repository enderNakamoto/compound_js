// for https://polywhale.finance/

require("dotenv").config();

const version = "0.0.1";

const Web3 = require('web3');
const cron = require("node-cron");

const addresses = require("./addresses");
const abis = require('./abis');
const helpers = require('./helpers');

// initialize web3
const options = {
  // Enable auto reconnection
  reconnect: {
      auto: true,
      delay: 20000, // ms
      maxAttempts: 6,
      onTimeout: false
  }
};
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.MATIC_PUBLIC_WS_URL_5, options)
);
// get admin account
const { address: admin } = web3.eth.accounts.wallet.add(process.env.MATIC_ADMIN_PRIVATE_KEY);

const debug = true;

console.log("staring.....")
debug && console.log('admin is ', admin);

const masterChef = new web3.eth.Contract(abis.PolyWhaleMasterChef, addresses.MATIC.PolyWhaleMasterChef);

cron.schedule("*/1 * * * *", function() {
  doSomething();
});


// harvest 
// swap 
// deposit
const singleSided = () => {
  
}

