const mongoose = require("mongoose");

const { Schema } = mongoose;

const familySchema = new Schema({
  balance: { type: Number, default: 0, required: true },
  flatPrice: { type: Number, default: 0, required: true },
  flatSquareMeters: { type: Number, default: 0, required: true },
  giftsUnpacked: { type: Number, default: 0 },
  giftsForUnpacking: { type: Number, default: 0 },
  totalSalary: { type: Number, default: 0, required: true },
  passiveIncome: { type: Number, default: 0, required: true },
  incomePercentageToSavings: { type: Number, default: 0, required: true },
},
  { timestamps: true }
);

familySchema.method("updateGiftsUnpack", function () {

  if (this.giftsForUnpacking <= 0) {
    this.giftsForUnpacking = 0;

    this.giftsUnpacked = Math.floor((this.balance * this.flatSquareMeters / this.flatPrice));

    return {
      forUnpacking: this.giftsForUnpacking,
      unpacked: this.giftsUnpacked,
    }
  }

  this.giftsForUnpacking = this.giftsForUnpacking - 1;
  this.giftsUnpacked = this.giftsUnpacked + 1;

  return {
    forUnpacking: this.giftsForUnpacking,
    unpacked: this.giftsUnpacked,
  }

});

module.exports = mongoose.model("Family", familySchema);
