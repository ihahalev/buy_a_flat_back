module.exports = () => {
  const date = new Date();
  const month = date.getMonth();
  const year = date.getFullYear();
  const daysPerMonth = new Date(year, month + 1, 0).getDate();
  return (daysToMonthEnd = daysPerMonth - date.getDate() + 1);
};
