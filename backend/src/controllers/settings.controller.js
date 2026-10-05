const Setting = require('../models/Setting');
const { logAction } = require('../middleware/auditLogger');

const DEFAULT_SETTINGS = [
  { key: 'hotel_name', value: 'GrandVista Hotel', category: 'general' },
  { key: 'currency', value: 'INR', category: 'general' },
  { key: 'tax_percent', value: 12, category: 'general' },
  { key: 'check_in_time', value: '14:00', category: 'booking' },
  { key: 'check_out_time', value: '11:00', category: 'booking' },
  { key: 'cancellation_hours', value: 24, category: 'booking' },
  { key: 'email_notifications', value: true, category: 'notification' },
  { key: 'sms_notifications', value: false, category: 'notification' },
];

const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find();

    // Auto-seed defaults on first run
    if (settings.length === 0) {
      const seeded = await Setting.insertMany(DEFAULT_SETTINGS);
      return res.status(200).json({ success: true, data: seeded });
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const before = await Setting.findOne({ key });

    const setting = await Setting.findOneAndUpdate(
      { key },
      { value, updatedBy: req.user._id },
      { new: true, upsert: true }
    );

    await logAction({
      action: 'SETTING_CHANGED',
      req,
      targetType: 'Setting',
      targetId: setting._id,
      targetLabel: key,
      description: `Changed setting "${key}"`,
      oldValue: { [key]: before?.value },
      newValue: { [key]: value },
    });

    res.status(200).json({ success: true, message: 'Setting updated', data: setting });
  } catch (error) {
    next(error);
  }
};

const bulkUpdateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body; // [{ key, value }]

    // Fetch prior values for audit logging
    const keys = settings.map((s) => s.key);
    const existingSettings = await Setting.find({ key: { $in: keys } });
    const beforeMap = existingSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const ops = settings.map(({ key, value }) => ({
      updateOne: {
        filter: { key },
        update: { value, updatedBy: req.user._id },
        upsert: true,
      },
    }));

    await Setting.bulkWrite(ops);
    const updated = await Setting.find();

    // Build diff objects for bulk update logging
    const oldValue = {};
    const newValue = {};
    settings.forEach(({ key, value }) => {
      oldValue[key] = beforeMap[key];
      newValue[key] = value;
    });

    await logAction({
      action: 'SETTINGS_BULK_UPDATED',
      req,
      targetType: 'Setting',
      targetLabel: `${settings.length} Settings`,
      description: `Updated ${settings.length} system settings`,
      oldValue,
      newValue,
    });

    res.status(200).json({ success: true, message: 'Settings updated', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSetting, bulkUpdateSettings };