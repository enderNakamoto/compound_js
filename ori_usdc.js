require("dotenv").config();

const version = "0.0.1";

const Web3 = require('web3');
const cron = require("node-cron");
const addresses = require("./addresses");
const abis = require('./abis');

const web3 = new Web3(process.env.FTM_PUBLIC_URL);
const masterChef = new web3.eth.Contract(abis.spiritMasterChef, addresses.FTM.hyperFarm);
const router = new web3.eth.Contract(abis.hyperRouter, addresses.FTM.hyperRouter);
const ori = new web3.eth.Contract(abis.erc20Token, addresses.FTM.ori);
const usdc = new web3.eth.Contract(abis.erc20Token, addresses.FTM.usdc);
const usdcFtmOriLp = new web3.eth.Contract(abis.erc20Token, addresses.FTM.usdcFtmOriLp);


// get admin account
const { address: admin } = web3.eth.accounts.wallet.add(process.env.FTM_ADMIN_PRIVATE_KEY);

const debug = true;
const ORI_USDC_FTM_POOL_PID = 3;
const GAST_COST = 1010000000;
const GAS_LIMIT = 500000;


console.log("staring.....")
console.log("version ", version);
debug && console.log('admin is ', admin);

const compound = async() => {
  var bal = await web3.eth.getBalance(admin);
  console.log("initial ftm balance is ", bal/(10**18));

  const transactionParams = {
    from: admin,
    gas: GAS_LIMIT,
    gasPrice: GAST_COST
  };
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 min

  console.log("--- STEP 1: harvesting ---");
  oriBalanceBeforeHarvest = await ori.methods.balanceOf(admin).call();
  await masterChef.methods.deposit(ORI_USDC_FTM_POOL_PID, 0).send(transactionParams);
  oriBalanceAfterHarvest = await ori.methods.balanceOf(admin).call();
  hallowedAreTheOri = oriBalanceAfterHarvest - oriBalanceBeforeHarvest;
  halfBalance = (hallowedAreTheOri/2).toString();

  console.log("--- STEP 2: swapping half ori to usdc ---");
  usdcBalanceBeforeSwap = await usdc.methods.balanceOf(admin).call();
  path = [addresses.FTM.ori, addresses.FTM.wftm, addresses.FTM.usdc];
  await router.methods.swapExactTokensForTokens(halfBalance, 0, path, admin, deadline).send(transactionParams);
  usdcBalanceAfterSwap = await usdc.methods.balanceOf(admin).call();
  usdcHarvested = usdcBalanceAfterSwap - usdcBalanceBeforeSwap;
  usdcHarvested = usdcHarvested.toString();

  console.log("--- STEP 2: swapping half ori to ftm ---");
  ftmBalanceBeforeSwap = await web3.eth.getBalance(admin);
  path = [addresses.FTM.ori, addresses.FTM.wftm];
  await router.methods.swapExactTokensForFTM(halfBalance, 0, path, admin, deadline).send(transactionParams);
  ftmBalanceAfterSwap = await web3.eth.getBalance(admin);
  ftmHarvested = ftmBalanceAfterSwap - ftmBalanceBeforeSwap;

  console.log("--- STEP 4: adding liquidity ---");
  const transactionParamsETH =  {
    from: admin,
    gas: GAS_LIMIT,
    gasPrice: GAST_COST,
    value : ftmHarvested
  };
  await router.methods.addLiquidityFTM(addresses.FTM.usdc, usdcHarvested, 0, 0, admin, deadline).send(transactionParamsETH);
  
  console.log('--- STEP 5: depositing lp back in pool');
  lpBalance = await usdcFtmOriLp.methods.balanceOf(admin).call();
  await await masterChef.methods.deposit(ORI_USDC_FTM_POOL_PID, lpBalance).send(transactionParams);

  console.log("---done---")
}

compound();

// compound every 10 minutes 
// cron.schedule("*/10 * * * *", function() {
//   compound();
// });