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
const frax = new web3.eth.Contract(abis.erc20Token, addresses.FTM.frax);
const fraxFtmSpiritLp = new web3.eth.Contract(abis.erc20Token, addresses.FTM.fraxFtmSpiritLp);

// get admin account
const { address: admin } = web3.eth.accounts.wallet.add(process.env.FTM_ADMIN_PRIVATE_KEY);

const debug = true;
const FRAX_FTM_POOL_PID =14;
const GAST_COST = 1010000000;
const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 min

console.log("staring.....")
console.log("version ", version);
debug && console.log('admin is ', admin);

const compound = async() => {
  var bal = await web3.eth.getBalance(admin);
  console.log("initial ftm balance is ", bal/(10**18));

  const transactionParams = {
    from: admin,
    gas: 500000,
    gasPrice: GAST_COST
  };

  spiritBalance = await spirit.methods.balanceOf(admin).call();
  console.log("spirit balance before harvest is", spiritBalance/(10**18));

  console.log("--- STEP 1: harvesting ---");
  await masterChef.methods.deposit(FRAX_FTM_POOL_PID, 0).send(transactionParams);

  spiritBalance = await spirit.methods.balanceOf(admin).call();
  console.log("spirit balance after harvest is", spiritBalance/(10**18));

  halfBalance = (spiritBalance/2).toString();

  console.log("--- STEP 2: swapping half spirit to frax ---");
  // path = [addresses.FTM.spirit, addresses.FTM.wftm, addresses.FTM.frax];
  // await router.methods.swapExactTokensForTokens(halfBalance, 0, path, admin, deadline).send(transactionParams);

  fraxBalance = await frax.methods.balanceOf(admin).call();
  console.log("frax balance is", fraxBalance/(10**18));

  spiritBalance = await spirit.methods.balanceOf(admin).call();
  console.log("spirit balance after swapping to frax is", spiritBalance/(10**18));

  console.log("--- STEP 3: swapping half spirit to ftm ---");
  // path = [addresses.FTM.spirit, addresses.FTM.wftm];
  // await router.methods.swapExactTokensForETH(halfBalance, 0, path, admin, deadline).send(transactionParams);

  var ftmBalance = await web3.eth.getBalance(admin);
  console.log("ftm balance is ", ftmBalance/(10**18));

  spiritBalance = await spirit.methods.balanceOf(admin).call();
  console.log("spirit balance after swapping to ftm is", spiritBalance/(10**18));

  // console.log("--- STEP 4: adding liquidity ---");
  // await router.methods.addLiquidityETH(addresses.FTM.frax, "20000000000000000000", 0, 0, admin, deadline).send(transactionParams);
  
  lpBalance = await fraxFtmSpiritLp.methods.balanceOf(admin).call();
  console.log("lp balance is ", lpBalance/(10**18));
  
  // console.log('-- STEP 5: depositing lp back in pool')
  // await await masterChef.methods.deposit(FRAX_FTM_POOL_PID, lpBalance).send(transactionParams);

  // console.log("---done---")
}

compound();

// compound every 5 hours 
cron.schedule("* */5 * * *", function() {
  //compound();
});
