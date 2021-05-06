require("dotenv").config();

const version = "0.0.1";

const Web3 = require('web3');
const cron = require("node-cron");
const addresses = require("./addresses");
const abis = require('./abis');

const web3 = new Web3(process.env.FTM_PUBLIC_URL);
const masterChef = new web3.eth.Contract(abis.esterStakingChef, addresses.FTM.esterStakingChef);
const ester = new web3.eth.Contract(abis.erc20Token, addresses.FTM.ester);

// get admin account
const { address: admin } = web3.eth.accounts.wallet.add(process.env.FTM_ADMIN_PRIVATE_KEY);

const ESTER_PID = 2;
const GAST_COST = 1020000000;
const GAS_LIMIT = 500000;


console.log("staring.....")
console.log("version ", version);
console.log('admin is ', admin);

const compound = async() => {
  var bal = await web3.eth.getBalance(admin);
  console.log("initial ftm balance is ", bal/(10**18));

  const transactionParams = {
    from: admin,
    gas: GAS_LIMIT,
    gasPrice: GAST_COST
  };

  console.log("--- STEP 1: harvesting ---");
  await masterChef.methods.withdraw(ESTER_PID, 0).send(transactionParams);
  harvestedPheromones = await ester.methods.balanceOf(admin).call();

  console.log('--- STEP 2: restake');
  await await masterChef.methods.deposit(ESTER_PID, harvestedPheromones.toString()).send(transactionParams);

  console.log("---done---")
}

//compound();

cron.schedule("*/3 * * * *", function() {
  compound();
});
