const ServiceCatalog = require('../models/ServiceCatalog');
const ApiError = require('../utils/ApiError');
const { logAction } = require('../middleware/auditLogger');

const getServices = async (req, res, next) => {
  try {
    const { department, activeOnly } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (activeOnly === 'true') filter.isActive = true;

    const services = await ServiceCatalog.find(filter).sort({ department: 1, name: 1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) { next(error); }
};

const createService = async (req, res, next) => {
  try {
    const service = await ServiceCatalog.create(req.body);
    await logAction({ action: 'SERVICE_CREATED', module: 'settings', req, targetType: 'ServiceCatalog', targetId: service._id, targetLabel: service.name, description: `Added service: ${service.name}` });
    res.status(201).json({ success: true, message: 'Service added', data: service });
  } catch (error) { next(error); }
};

const updateService = async (req, res, next) => {
  try {
    const before = await ServiceCatalog.findById(req.params.id);
    if (!before) throw new ApiError(404, 'Service not found');

    const service = await ServiceCatalog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await logAction({
      action: 'SERVICE_UPDATED', module: 'settings', req, targetType: 'ServiceCatalog', targetId: service._id, targetLabel: service.name,
      description: `Updated service: ${service.name}`,
      oldValue: { price: before.price, isActive: before.isActive },
      newValue: { price: service.price, isActive: service.isActive },
    });
    res.status(200).json({ success: true, message: 'Service updated', data: service });
  } catch (error) { next(error); }
};

const deleteService = async (req, res, next) => {
  try {
    const service = await ServiceCatalog.findByIdAndDelete(req.params.id);
    if (!service) throw new ApiError(404, 'Service not found');
    res.status(200).json({ success: true, message: 'Service removed' });
  } catch (error) { next(error); }
};

module.exports = { getServices, createService, updateService, deleteService };