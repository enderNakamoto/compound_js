require("dotenv").config();

const version = "0.0.1";

const Web3 = require('web3');
const cron = require("node-cron");
const addresses = require("./addresses");
const abis = require('./abis');

const web3 = new Web3(process.env.FTM_PUBLIC_URL);
const froyoLpStaker = new web3.eth.Contract(abis.froyoLpTokenStaker, addresses.FTM.froyoLpTokenStaker);
const sushiRouter = new web3.eth.Contract(abis.sushiRouter, addresses.FTM.sushiRouter);
const multiFeeDist = new web3.eth.Contract(abis.MultiFeeDistribution, addresses.FTM.MultiFeeDistribution);
const froyo = new web3.eth.Contract(abis.erc20Token, addresses.FTM.froyo);
const froyoFtmSushiLP = new web3.eth.Contract(abis.erc20Token, addresses.FTM.froyoFtmSushiLP);

// get admin account
const { address: admin } = web3.eth.accounts.wallet.add(process.env.FTM_ADMIN_PRIVATE_KEY);

const FROYO_FTM_POOL_PID = 0;
const GAS_COST = 1030000000;
const GAS_LIMIT = 500000;


console.log("staring.....")
console.log("version ", version);
console.log('admin is ', admin);

const compoundFroyo = async() => {
  var bal = await web3.eth.getBalance(admin);
  console.log("initial ftm balance is ", bal/(10**18));

  const transactionParams = {
    from: admin,
    gas: GAS_LIMIT,
    gasPrice: GAS_COST
  };
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 min

  console.log("--- STEP 1: claiming---");
  const pids = [FROYO_FTM_POOL_PID];
  claimableRewardBefore = await froyoLpStaker.methods.claimableReward(FROYO_FTM_POOL_PID,admin).call();
  await froyoLpStaker.methods.claim(pids).send(transactionParams);
  claimableRewardAfter = await froyoLpStaker.methods.claimableReward(FROYO_FTM_POOL_PID,admin).call();
  claimedReward = claimableRewardBefore - claimableRewardAfter;
  half = (claimedReward/2).toString();

  // take the 50% hit 
  console.log("--- STEP 2: 50 percent hit!---");
  froyoBalanceBeforeHarvest = await froyo.methods.balanceOf(admin).call();
  await multiFeeDist.methods.withdraw(half).send(transactionParams);
  froyoBalanceAfterHarvest = await froyo.methods.balanceOf(admin).call();
  yogurtMama = froyoBalanceAfterHarvest - froyoBalanceBeforeHarvest;
  halfBalance = (yogurtMama/2).toString();

  console.log("--- STEP 3: swapping half froyo to ftm ---");
  ftmBalanceBeforeSwap = await web3.eth.getBalance(admin);
  path = [addresses.FTM.froyo, addresses.FTM.wftm];
  await sushiRouter.methods.swapExactTokensForETH(halfBalance, 0, path, admin, deadline).send(transactionParams);
  ftmBalanceAfterSwap = await web3.eth.getBalance(admin);
  ftmHarvested = ftmBalanceAfterSwap - ftmBalanceBeforeSwap;

  console.log("--- STEP 4: adding liquidity ---");
  const transactionParamsETH =  {
    from: admin,
    gas: GAS_LIMIT,
    gasPrice: GAS_COST,
    value : ftmHarvested
  };
  await sushiRouter.methods.addLiquidityETH(addresses.FTM.froyo, halfBalance, 0, 0, admin, deadline).send(transactionParamsETH);
  
  console.log('--- STEP 5: depositing lp back in pool');
  lpBalance = await froyoFtmSushiLP.methods.balanceOf(admin).call();
  await await froyoLpStaker.methods.deposit(FROYO_FTM_POOL_PID, lpBalance).send(transactionParams);

  console.log("---done---")
}

//compoundFroyo();

// compound every 10 minutes 
// cron.schedule("*/10 * * * *", function() {
//   compoundFroyo();
// });
