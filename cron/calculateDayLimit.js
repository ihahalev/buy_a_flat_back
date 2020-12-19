const cron = require('node-cron');
const { familyModel, transactionModel } = require('../database/models');

const { getLogger, expenseLimits } = require('../helpers');
const logger = getLogger('calculateDayLimit');

async function main() {
  try {
    await cron.schedule('5 0 * * *', async function () {
      const allFamilies = await familyModel.find({});

      await Promise.all(
        allFamilies.map(async (item) => {
          const { _id } = item;

          const { monthBalance } = await transactionModel.getFamilyMonthBalance(
            _id,
          );

          const { dayLimit, monthLimit } = expenseLimits(item, monthBalance);

          const desiredSavings = item.getDesiredSavings();
          const available = monthBalance - desiredSavings;
          const dailySum = available / daysToMonthEnd;

          await familyModel.findByIdAndUpdate(
            _id,
            {
              dayLimit,
              monthLimit,
            },
            { new: true },
          );
        }),
      );

      logger.info(
        `FamilyModel update  dailyLimit and monthLimit every day of (00:00)`,
      );
    });
  } catch (err) {
    logger.error(err);
  }
}

module.exports = main;
