const { plot } = require('nodeplotlib');

const principle = 5700; 
const starting_apr = 17971;
//  if rate is 1% & compound_every_x_hr is 1, then 1% every hour and 24% per day
const apr_rate_of_decay = 10; 
const period_in_hours = 0.083;
const apr_floor = 500; 
const days = 3;
const deposit_fee_percentage = 50;
const swap_fee_percentage = 0.3;
const gas_cost_in_usd = 0.05;


const aprToPeriodRate = (apr) => {
   hourly_rate = (apr/365)/24;
   return hourly_rate * period_in_hours;
}

const calcLinearInterest = (i) => {
   effective_apr = starting_apr  - i*apr_rate_of_decay;
   return Math.max(effective_apr, apr_floor);
}

const percentageOfAmount = (amount, percent) => {
   return (percent/100) * amount; 
}

console.log("compounding frequency per day ->", 24/period_in_hours);

// initial deposit
//let amount = principle - (deposit_fee_percentage/100 * principle);
let amount = principle;

// starting with initial values for chart
let hours = [0]; 
let amounts = [amount];
let aprs = [starting_apr];

 const number_of_compounds= (days * 24)/period_in_hours;

for (let i = 1; i < number_of_compounds + 1;  i++ ){
   effective_apr = calcLinearInterest(i)
   effective_interest = aprToPeriodRate(effective_apr);
   gain = percentageOfAmount(amount, effective_interest); 
   deposit_fee = percentageOfAmount(gain, deposit_fee_percentage);
   swap_fee = percentageOfAmount(gain, swap_fee_percentage);
   amount = amount + gain - deposit_fee - swap_fee - gas_cost_in_usd;
   amounts.push(amount);
   aprs.push(effective_apr);
   hour = i*period_in_hours;
   hours.push(hour); 
   console.log("period - total", hour, amount); 
}


const data = {x: hours, y: amounts, type: 'line'};
const data1 = {x: hours, y: aprs, type: 'line'};
plot([data, data1]);