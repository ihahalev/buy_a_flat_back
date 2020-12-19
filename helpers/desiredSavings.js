module.exports = function () {
  const sum = parseFloat(this.totalSalary) + parseFloat(this.passiveIncome);
  const savings = (sum * parseFloat(this.incomePercentageToSavings)) / 100.0;
  console.log('savings', savings, sum);
  return savings.toFixed(2);
};
