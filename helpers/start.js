const date = new Date(2020, 1);
const month = date.getMonth();
const year = date.getFullYear();
const daysPerMonth = new Date(year, month + 1, 0).getDate();
console.log(date);
console.log(daysPerMonth);
