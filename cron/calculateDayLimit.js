const cron = require('node-cron');
const {
  familyModel,
  transactionModel,
} = require('../database/models');

const { getLogger } = require('../helpers');
const logger = getLogger('calculateDayLimit');

async function main() {
  try {
    await cron.schedule('0 0 * * *', async function () {
      const allFamilies = await familyModel.find({});

      await Promise.all(
        allFamilies.map(async (item) => {

          const { _id, totalSalary, incomePercentageToSavings } = item;

          const date = new Date;
          const month = date.getMonth();
          const year = date.getFullYear();
          const daysPerMonth = new Date(year, month, 0).getDate();
          const daysToMonthEnd = daysPerMonth - new Date().getDate() + 1;

          const monthBalance = await transactionModel.getFamilyMonthBalance(_id);

          const available = (monthBalance - (totalSalary * incomePercentageToSavings) / 100);
          const dailySum = available / daysToMonthEnd;

          let transaction = await transactionModel.findOne({ familyId: _id })

          await familyModel.findByIdAndUpdate(
            _id,
            {
              dailyLimit: (dailySum - Number(transaction.amount)).toFixed(2),
              monthLimit: (available - Number(transaction.amount)).toFixed(2),
            },
            { new: true },
          )
        }),
      );

      logger.info(`FamilyModel update  dailyLimit and monthLimit every day of (00:00)`);
    });
  } catch (err) {
    logger.error(err);
  };
};

module.exports = main;
