const daysToMonthEnd = require('./daysToMonthEnd');
const desiredSavings = require('./desiredSavings');

module.exports = (object, monthBalance) => {
  const savings = desiredSavings.call(object);
  const available = monthBalance - savings;
  const dailySum = available / daysToMonthEnd();
  console.log('expenseLim', monthBalance, daysToMonthEnd());
  return { dayLimit: dailySum.toFixed(2), monthLimit: available.toFixed(2) };
};
