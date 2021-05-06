require("dotenv").config();

const version = "0.0.1";

const Web3 = require('web3');
const cron = require("node-cron");
const addresses = require("./addresses");
const abis = require('./abis');

const web3 = new Web3(process.env.FTM_PUBLIC_URL);
const masterChef = new web3.eth.Contract(abis.spiritMasterChef, addresses.FTM.spiritMAsterChef);
const router = new web3.eth.Contract(abis.spiritRouter, addresses.FTM.spiritRouter);
const spirit = new web3.eth.Contract(abis.erc20Token, addresses.FTM.spirit);
const spiritFtmLP = new web3.eth.Contract(abis.erc20Token, addresses.FTM.spiritFtmLP);

// get admin account
const { address: admin } = web3.eth.accounts.wallet.add(process.env.FTM_ADMIN_PRIVATE_KEY);

const SPIRIT_FTM_POOL_PID =1;
const GAS_COST = 1010000000; //1.01 gwei
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
    gasPrice: GAS_COST
  };
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 min

  // doing no other spirit compounding, so need to check before and after,
  // just look at spirit balance, divide it in half and change to ftm 
  // make LP and compound! 

  // change it accoirding to your needs! 

  console.log("--- STEP 1: harvesting ---");
  await masterChef.methods.deposit(SPIRIT_FTM_POOL_PID, 0).send(transactionParams);
  genkiDama = await spirit.methods.balanceOf(admin).call();
  halfGenkiDama = (genkiDama/2).toString();

  console.log("--- STEP 2: swapping half spirit to ftm ---");
  ftmBalanceBeforeSwap = await web3.eth.getBalance(admin);
  path = [addresses.FTM.spirit, addresses.FTM.wftm];
  await router.methods.swapExactTokensForETH(halfGenkiDama, 0, path, admin, deadline).send(transactionParams);
  ftmBalanceAfterSwap = await web3.eth.getBalance(admin);
  ftmHarvested = ftmBalanceAfterSwap - ftmBalanceBeforeSwap;

  console.log("--- STEP 3: adding liquidity ---");
  const transactionParamsETH =  {
    from: admin,
    gas: GAS_LIMIT,
    gasPrice: GAS_COST,
    value : ftmHarvested
  };
  await router.methods.addLiquidityETH(addresses.FTM.spirit, halfGenkiDama, 0, 0, admin, deadline).send(transactionParamsETH);
  
  console.log('--- STEP 4: depositing lp back in pool');
  lpBalance = await spiritFtmLP.methods.balanceOf(admin).call();
  await await masterChef.methods.deposit(SPIRIT_FTM_POOL_PID, lpBalance).send(transactionParams);

  console.log("---done---")
}

compound();

// compound every 10 minutes 
// cron.schedule("*/10 * * * *", function() {
//   compound();
// });
