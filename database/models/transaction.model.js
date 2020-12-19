const mongoose = require('mongoose');
const {
  Types: { ObjectId },
} = mongoose;
const { transactionCategories, transactionTypes } = require('../staticData');

const transactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    transactionDate: { type: Date, required: true },
    type: {
      type: String,
      enum: transactionTypes,
      default: transactionTypes[0],
      required: true,
    },
    category: {
      type: String,
      default: transactionCategories[0].name,
      required: true,
    },
    comment: String,
    familyId: { type: ObjectId, ref: 'Family' },
    userId: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

transactionSchema.static(
  'updateIncomeAndPercent',
  async function (familyId, income, percent) {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const startDate = `${date.getFullYear()}-${month}-01`;
    await this.updateOne(
      {
        familyId,
        transactionDate: {
          $gte: new Date(startDate),
        },
        type: 'INCOME',
      },
      { amount: income },
    );
    await this.updateOne(
      {
        familyId,
        transactionDate: {
          $gte: new Date(startDate),
        },
        type: 'PERCENT',
      },
      { amount: percent },
    );
  },
);

transactionSchema.static(
  'getFamilyAnnualReport',
  async function (familyId, month, year) {
    const calcMonth = String(month + 1).padStart(2, '0');
    let endDate;
    let startDate;
    if (month >= 12) {
      endDate = `${year}-01-01`;
      startDate = `${year + 1}-01-01`;
    } else {
      endDate = `${year - 1}-${calcMonth}-01`;
      startDate = `${year}-${calcMonth}-01`;
    }
    return this.aggregate([
      {
        $match: {
          familyId,
        },
      },
      {
        $match: {
          transactionDate: {
            $gte: new Date(endDate),
            $lt: new Date(startDate),
          },
        },
      },
      {
        $addFields: {
          incomeAmount: {
            $cond: [{ $eq: ['$type', 'INCOME'] }, '$amount', 0],
          },
          expenses: {
            $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0],
          },
          percentAmount: {
            $cond: [{ $eq: ['$type', 'PERCENT'] }, '$amount', null],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$transactionDate',
            },
          },
          incomeAmount: { $sum: '$incomeAmount' },
          expenses: { $sum: '$expenses' },
          percentAmount: { $avg: '$percentAmount' },
          // comment: { $addToSet: '$comment' },
        },
      },
      {
        $addFields: {
          savings: { $subtract: ['$incomeAmount', '$expenses'] },
          expectedSavings: {
            $multiply: ['$incomeAmount', '$percentAmount', 0.01],
          },
          year: {
            $year: {
              date: {
                $dateFromString: { dateString: { $concat: ['$_id', '-01'] } },
              },
            },
          },
          month: {
            $month: {
              date: {
                $dateFromString: { dateString: { $concat: ['$_id', '-01'] } },
              },
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);
  },
);

transactionSchema.static(
  'getFamilyMonthReport',
  async function (familyId, month, year) {
    const calcMonth = String(month + 1).padStart(2, '0');
    const endDate = `${year}-${month}-01`;
    let startDate;
    if (month >= 12) {
      startDate = `${year + 1}-01-01`;
    } else {
      startDate = `${year}-${calcMonth}-01`;
    }
    return this.aggregate([
      {
        $match: {
          familyId,
          type: 'EXPENSE',
        },
      },
      {
        $match: {
          transactionDate: {
            $gte: new Date(endDate),
            $lt: new Date(startDate),
          },
        },
      },
      {
        $facet: {
          categorized: [
            {
              $group: {
                _id: '$category',
                amount: { $sum: '$amount' },
              },
            },
          ],
          total: [
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
              },
            },
          ],
        },
      },
      {
        $unwind: '$categorized',
      },
      {
        $unwind: '$total',
      },
      {
        $project: {
          category: '$categorized._id',
          expense: '$categorized.amount',
          // total: '$total.total',
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$categorized.amount', '$total.total'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ]);
  },
);

transactionSchema.static('getFamilyMonthBalance', async function (familyId) {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const startDate = `${date.getFullYear()}-${month}-01`;
  const today = `${date.getFullYear()}-${month}-${date.getDate()}`;
  const groupRes = await this.aggregate([
    {
      $match: {
        familyId: familyId,
      },
    },
    {
      $facet: {
        monthIncome: [
          {
            $match: {
              transactionDate: { $gte: new Date(startDate) },
            },
          },
          {
            $addFields: {
              amount: { $ifNull: ['$amount', 0] },
              incomeAmount: {
                $cond: [{ $eq: ['$type', 'INCOME'] }, '$amount', 0],
              },
            },
          },
          {
            $group: {
              _id: null,
              income: { $sum: '$incomeAmount' },
            },
          },
        ],
        monthExpense: [
          {
            $match: {
              transactionDate: {
                $gte: new Date(startDate),
                $lt: new Date(today),
              },
            },
          },
          {
            $addFields: {
              amount: { $ifNull: ['$amount', 0] },
              expenses: {
                $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0],
              },
            },
          },
          {
            $group: {
              _id: null,
              expenses: { $sum: '$expenses' },
            },
          },
        ],
        todayExpense: [
          {
            $match: {
              transactionDate: { $gte: new Date(today) },
            },
          },
          {
            $addFields: {
              amount: { $ifNull: ['$amount', 0] },
              expenses: {
                $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0],
              },
            },
          },
          {
            $group: {
              _id: null,
              expToday: { $sum: '$expenses' },
            },
          },
        ],
      },
    },
  ]);

  if (groupRes.length) {
    const [{ monthIncome, monthExpense, todayExpense }] = groupRes;
    let income;
    let expenses;
    let expToday;
    if (monthIncome.length) {
      income = monthIncome[0].income;
      if (!Number.isInteger(income)) {
        income = 0;
      }
    } else {
      income = 0;
    }
    if (monthExpense.length) {
      expenses = monthExpense[0].expenses;
      if (!Number.isInteger(expenses)) {
        expenses = 0;
      }
    } else {
      expenses = 0;
    }
    if (todayExpense.length) {
      expToday = todayExpense[0].expToday;
      if (!Number.isInteger(expToday)) {
        expToday = 0;
      }
    } else {
      expToday = 0;
    }
    console.log('getFamilyMonthBalance', income, expenses, expToday);
    const monthBalance = income - expenses;
    return { monthBalance, expToday };
  } else {
    return { monthBalance: 0, expToday: 0 };
  }
});

transactionSchema.static(
  'getDayRecords',
  async function (familyId, date, page, limit) {
    const startDate = new Date(date);
    let endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 1);
    return this.aggregate([
      {
        $match: {
          familyId,
        },
      },
      {
        $match: {
          type: 'EXPENSE',
        },
      },
      {
        $match: {
          transactionDate: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
        },
      },
      { $sort: { transactionDate: -1 } },
      { $skip: page * limit },
      { $limit: limit },
    ]);
  },
);

transactionSchema.static(
  'monthlyAccrual',
  async function (income, percent, userId, familyId, savings = 0) {
    let groupRes = [];
    if (!savings || savings <= 0) {
      const date = new Date();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const startDate = `${date.getFullYear()}-${month}-01`;
      groupRes = await this.aggregate([
        {
          $match: {
            familyId: familyId,
          },
        },
        {
          $match: {
            transactionDate: { $lt: new Date(startDate) },
          },
        },
        {
          $addFields: {
            transactionDate: '$transactionDate',
            amount: { $ifNull: ['$amount', 0] },
            incomeAmount: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$type', 'INCOME'] },
                    { $eq: ['$type', 'SAVINGS'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
            expenses: {
              $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            incomeAmount: { $sum: '$incomeAmount' },
            expenses: { $sum: '$expenses' },
            totalSavings: {
              $sum: { $subtract: ['$incomeAmount', '$expenses'] },
            },
          },
        },
      ]);
    } else {
      await this.create({
        amount: savings,
        type: 'SAVINGS',
        category: 'Сбережения',
        comment: 'Начальные сбережения',
        familyId,
        userId,
        transactionDate: Date.now(),
      });
    }
    await this.create({
      amount: income,
      type: 'INCOME',
      category: 'Доход',
      comment: 'Ежемесячное начисление',
      familyId,
      userId,
      transactionDate: Date.now(),
    });
    await this.create({
      amount: percent,
      type: 'PERCENT',
      category: 'Ожидаемые сбережения',
      comment: 'Процент от дохода',
      familyId,
      userId,
      transactionDate: Date.now(),
    });

    if (groupRes.length) {
      const [{ totalSavings }] = groupRes;
      if (!Number.isInteger(totalSavings)) {
        return 0;
      }
      return totalSavings;
    } else {
      return 0;
    }
  },
);

module.exports = mongoose.model('Transaction', transactionSchema);
