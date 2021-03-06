require("dotenv").config();

const version = "0.0.1";

const Web3 = require('web3');
const cron = require("node-cron");
const addresses = require("./addresses");
const abis = require('./abis');

const web3 = new Web3(process.env.FTM_PUBLIC_URL);
const esterMasterChef = new web3.eth.Contract(abis.esterStakingChef, addresses.FTM.esterStakingChef);
const ester = new web3.eth.Contract(abis.erc20Token, addresses.FTM.ester);

const spiritMasterChef = new web3.eth.Contract(abis.spiritMasterChef, addresses.FTM.spiritMAsterChef);
const spiritRouter = new web3.eth.Contract(abis.spiritRouter, addresses.FTM.spiritRouter);
const spirit = new web3.eth.Contract(abis.erc20Token, addresses.FTM.spirit);
const spiritFtmLP = new web3.eth.Contract(abis.erc20Token, addresses.FTM.spiritFtmLP);

const froyoLpStaker = new web3.eth.Contract(abis.froyoLpTokenStaker, addresses.FTM.froyoLpTokenStaker);
const sushiRouter = new web3.eth.Contract(abis.sushiRouter, addresses.FTM.sushiRouter);
const multiFeeDist = new web3.eth.Contract(abis.MultiFeeDistribution, addresses.FTM.MultiFeeDistribution);
const froyo = new web3.eth.Contract(abis.erc20Token, addresses.FTM.froyo);
const froyoFtmSushiLP = new web3.eth.Contract(abis.erc20Token, addresses.FTM.froyoFtmSushiLP);

// get admin account
const { address: admin } = web3.eth.accounts.wallet.add(process.env.FTM_ADMIN_PRIVATE_KEY);

const ESTER_PID = 2;
const SPIRIT_FTM_POOL_PID =1;
const FROYO_FTM_POOL_PID = 0;
const GAS_COST = 1020000000;
const GAS_LIMIT = 500000;

console.log("staring.....")
console.log("version ", version);
console.log('admin is ', admin);

// compound est! 
const compoundEst = async() => {
  var bal = await web3.eth.getBalance(admin);
  console.log("initial ftm balance is ", bal/(10**18));

  const transactionParams = {
    from: admin,
    gas: GAS_LIMIT,
    gasPrice: GAS_COST
  };

  console.log("--- STEP 1: harvesting ---");
  await esterMasterChef.methods.withdraw(ESTER_PID, 0).send(transactionParams);
  harvestedPheromones = await ester.methods.balanceOf(admin).call();

  console.log('--- STEP 2: restake');
  await await esterMasterChef.methods.deposit(ESTER_PID, harvestedPheromones.toString()).send(transactionParams);

  console.log("---done---")
}

//compound spirit-ftm LP
const compoundSpiritFtm = async() => {
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
  await spiritMasterChef.methods.deposit(SPIRIT_FTM_POOL_PID, 0).send(transactionParams);
  genkiDama = await spirit.methods.balanceOf(admin).call();
  halfGenkiDama = (genkiDama/2).toString();

  console.log("--- STEP 2: swapping half spirit to ftm ---");
  ftmBalanceBeforeSwap = await web3.eth.getBalance(admin);
  path = [addresses.FTM.spirit, addresses.FTM.wftm];
  await spiritRouter.methods.swapExactTokensForETH(halfGenkiDama, 0, path, admin, deadline).send(transactionParams);
  ftmBalanceAfterSwap = await web3.eth.getBalance(admin);
  ftmHarvested = ftmBalanceAfterSwap - ftmBalanceBeforeSwap;

  console.log("--- STEP 3: adding liquidity ---");
  const transactionParamsETH =  {
    from: admin,
    gas: GAS_LIMIT,
    gasPrice: GAS_COST,
    value : ftmHarvested
  };
  await spiritRouter.methods.addLiquidityETH(addresses.FTM.spirit, halfGenkiDama, 0, 0, admin, deadline).send(transactionParamsETH);
  
  console.log('--- STEP 4: depositing lp back in pool');
  lpBalance = await spiritFtmLP.methods.balanceOf(admin).call();
  await await spiritMasterChef.methods.deposit(SPIRIT_FTM_POOL_PID, lpBalance).send(transactionParams);

  console.log("---done---")
}

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

const compound = async () => {
  await compoundEst();
  await compoundSpiritFtm();
  await compoundFroyo();
}

compound();

// cron.schedule("*/10 * * * *", function() {
//   compound();
// });
