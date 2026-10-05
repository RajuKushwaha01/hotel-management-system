const Equipment = require('../models/Equipment');
const ApiError = require('../utils/ApiError');
const { logAction } = require('../middleware/auditLogger');

const getEquipment = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    const items = await Equipment.find(filter).sort({ nextServiceDue: 1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) { next(error); }
};

const createEquipment = async (req, res, next) => {
  try {
    const item = await Equipment.create(req.body);
    res.status(201).json({ success: true, message: 'Equipment added', data: item });
  } catch (error) { next(error); }
};

const updateEquipment = async (req, res, next) => {
  try {
    const item = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) throw new ApiError(404, 'Equipment not found');
    res.status(200).json({ success: true, message: 'Equipment updated', data: item });
  } catch (error) { next(error); }
};

const logService = async (req, res, next) => {
  try {
    const { note, cost, performedBy, nextServiceDue } = req.body;
    const item = await Equipment.findById(req.params.id);
    if (!item) throw new ApiError(404, 'Equipment not found');

    item.serviceHistory.push({ date: new Date(), note, cost, performedBy });
    item.lastServiceDate = new Date();
    if (nextServiceDue) item.nextServiceDue = nextServiceDue;
    item.status = 'operational';
    await item.save();

    await logAction({ action: 'EQUIPMENT_SERVICED', module: 'maintenance', req, targetType: 'Equipment', targetId: item._id, targetLabel: item.name, description: `Serviced ${item.name}: ${note}` });

    res.status(200).json({ success: true, message: 'Service logged', data: item });
  } catch (error) { next(error); }
};

const deleteEquipment = async (req, res, next) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Equipment removed' });
  } catch (error) { next(error); }
};

module.exports = { getEquipment, createEquipment, updateEquipment, logService, deleteEquipment };