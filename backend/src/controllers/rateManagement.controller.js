const RoomRate = require('../models/RoomRate');
const RatePlan = require('../models/RatePlan');
const ApiError = require('../utils/ApiError');
const { logAction, buildChanges } = require('../middleware/auditLogger');

// ---------- BASE ROOM RATES ----------
const getRoomRates = async (req, res, next) => {
  try {
    const rates = await RoomRate.find().sort({ roomType: 1 });
    res.status(200).json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
};

const upsertRoomRate = async (req, res, next) => {
  try {
    const { roomType } = req.body;
    const before = await RoomRate.findOne({ roomType });

    const rate = await RoomRate.findOneAndUpdate({ roomType }, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    const fieldsToTrack = ['standardRate', 'weekendRate', 'extraGuestCharge', 'extraBedCharge', 'childCharge'];
    const { oldValue, newValue, changed } = buildChanges(
      before ? before.toObject() : {},
      req.body,
      fieldsToTrack
    );

    if (changed) {
      await logAction({
        action: 'RATE_UPDATED',
        req,
        targetType: 'RoomRate',
        targetId: rate._id,
        targetLabel: `${rate.roomType} rate`,
        description: `Changed ${rate.roomType} room rates`,
        oldValue,
        newValue,
      });
    }

    res.status(200).json({ success: true, message: 'Rate saved', data: rate });
  } catch (error) {
    next(error);
  }
};

// ---------- RATE PLANS (seasonal/holiday/corporate/promotional) ----------
const getRatePlans = async (req, res, next) => {
  try {
    const { type, active } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (active !== undefined) filter.isActive = active === 'true';

    const plans = await RatePlan.find(filter).sort({ startDate: -1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

const createRatePlan = async (req, res, next) => {
  try {
    const plan = await RatePlan.create(req.body);

    await logAction({
      action: 'RATE_PLAN_CREATED',
      req,
      targetType: 'RatePlan',
      targetId: plan._id,
      targetLabel: plan.name,
      description: `Created rate plan: ${plan.name}`,
      newValue: plan.toObject(),
    });

    res.status(201).json({ success: true, message: 'Rate plan created', data: plan });
  } catch (error) {
    next(error);
  }
};

const updateRatePlan = async (req, res, next) => {
  try {
    const existingPlan = await RatePlan.findById(req.params.id);
    if (!existingPlan) throw new ApiError(404, 'Rate plan not found');

    const before = existingPlan.toObject();

    const plan = await RatePlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    const fieldsToTrack = ['name', 'type', 'rate', 'startDate', 'endDate', 'isActive', 'promoCode', 'companyName'];
    const { oldValue, newValue, changed } = buildChanges(before, req.body, fieldsToTrack);

    if (changed) {
      await logAction({
        action: 'RATE_PLAN_UPDATED',
        req,
        targetType: 'RatePlan',
        targetId: plan._id,
        targetLabel: plan.name,
        description: `Updated rate plan: ${plan.name}`,
        oldValue,
        newValue,
      });
    }

    res.status(200).json({ success: true, message: 'Rate plan updated', data: plan });
  } catch (error) {
    next(error);
  }
};

const deleteRatePlan = async (req, res, next) => {
  try {
    const plan = await RatePlan.findByIdAndDelete(req.params.id);
    if (!plan) throw new ApiError(404, 'Rate plan not found');

    await logAction({
      action: 'RATE_PLAN_DELETED',
      req,
      targetType: 'RatePlan',
      targetId: req.params.id,
      targetLabel: plan.name,
      description: `Deleted rate plan: ${plan.name}`,
      oldValue: plan.toObject(),
    });

    res.status(200).json({ success: true, message: 'Rate plan removed' });
  } catch (error) {
    next(error);
  }
};

// ---------- RATE CALCULATOR ----------
const calculateRate = async (req, res, next) => {
  try {
    const { roomType, checkIn, checkOut, promoCode, companyName, extraGuests = 0, extraBeds = 0, children = 0 } = req.query;

    const baseRate = await RoomRate.findOne({ roomType });
    if (!baseRate) throw new ApiError(404, 'No rate configured for this room type');

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    // Check for an active special rate plan overriding the base rate
    let appliedPlan = null;
    let nightlyRate = baseRate.standardRate;

    if (promoCode) {
      appliedPlan = await RatePlan.findOne({ roomType, type: 'promotional', promoCode, isActive: true });
    }
    if (!appliedPlan && companyName) {
      appliedPlan = await RatePlan.findOne({ roomType, type: 'corporate', companyName, isActive: true });
    }
    if (!appliedPlan) {
      // seasonal/holiday plans that overlap the stay dates
      appliedPlan = await RatePlan.findOne({
        roomType,
        type: { $in: ['seasonal', 'holiday'] },
        isActive: true,
        startDate: { $lte: end },
        endDate: { $gte: start },
      });
    }

    if (appliedPlan) {
      nightlyRate = appliedPlan.rate;
    } else {
      // fall back to weekend rate if any night in the stay falls on Sat/Sun
      let hasWeekend = false;
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) {
          hasWeekend = true;
          break;
        }
      }
      if (hasWeekend) nightlyRate = baseRate.weekendRate;
    }

    const roomCost = nightlyRate * nights;
    const extraCharges =
      Number(extraGuests) * baseRate.extraGuestCharge +
      Number(extraBeds) * baseRate.extraBedCharge +
      Number(children) * baseRate.childCharge;

    res.status(200).json({
      success: true,
      data: {
        nights,
        nightlyRate,
        roomCost,
        extraCharges,
        totalAmount: roomCost + extraCharges,
        rateTypeApplied: appliedPlan ? appliedPlan.type : (nightlyRate === baseRate.weekendRate ? 'weekend' : 'standard'),
        planName: appliedPlan?.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoomRates,
  upsertRoomRate,
  getRatePlans,
  createRatePlan,
  updateRatePlan,
  deleteRatePlan,
  calculateRate,
};