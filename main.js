// possible place to orchestarte all compoundings 

require("dotenv").config();

const Web3 = require('web3');
const cron = require("node-cron");

const version = "0.0.1";


const web3 = new Web3(process.env.FTM_PUBLIC_URL);
// get admin account
const { address: admin } = web3.eth.accounts.wallet.add(process.env.FTM_ADMIN_PRIVATE_KEY);

console.log("staring.....")
console.log("version ", version);
console.log('global admin is ', admin);

// const ori = require('./ori');
const oriUsdc = require('./ori_usdc');

// ori.compoundOri(admin);
oriUsdc.compoundOriUSDC(admin);


// cron.schedule("*/5 * * * *", function() {
//   ori.compoundOri();
//   oriUsdc.compoundOriUSDC()''
// });