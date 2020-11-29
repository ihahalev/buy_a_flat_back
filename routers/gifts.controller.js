const { familyModel } = require('../database/models');
const { ApiError, errorHandler, getLogger } = require('../helpers');
const responseNormalizer = require('../normalizers/response-normalizer');

const logger = getLogger('gifts');

class giftsController {
  constructor() { }

  async unpackGift(req, res) {
    try {
      const { familyId } = req.user;

      if (!familyId) {
        throw new ApiError(404, 'user not a member of family');
      }

      const family = await familyModel.findById(familyId);

      const { forUnpacking, unpacked } = family.updateGiftsUnpack();

      const { giftsForUnpacking, giftsUnpacked } = await familyModel.findByIdAndUpdate(
        familyId,
        {
          giftsForUnpacking: forUnpacking,
          giftsUnpacked: unpacked,
        },
        { new: true },
      );

      return responseNormalizer(200, res, {
        gifts: {
          giftsUnpacked,
          giftsForUnpacking,
        },
      });
    } catch (err) {
      logger.error(err);
      errorHandler(req, res, err);
    }
  }
}

module.exports = new giftsController();
