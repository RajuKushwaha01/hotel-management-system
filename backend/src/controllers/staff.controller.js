const Staff = require('../models/Staff');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const createStaffProfile = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, phone, role, password,
      department, designation, joiningDate, emergencyContact, salary, address,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(400, 'Email already in use');

    const user = await User.create({ firstName, lastName, email, phone, role, password });

    const staff = await Staff.create({
      user: user._id, department, designation, joiningDate,
      emergencyContact, salary, address,
    });

    const populated = await staff.populate('user', 'firstName lastName email phone role avatar isActive');
    res.status(201).json({ success: true, message: 'Employee added', data: populated });
  } catch (error) {
    next(error);
  }
};

const getAllStaff = async (req, res, next) => {
  try {
    const { department, employmentStatus } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (employmentStatus) filter.employmentStatus = employmentStatus;

    const staff = await Staff.find(filter)
      .populate('user', 'firstName lastName email phone role avatar isActive')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

const getStaffProfile = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('user', 'firstName lastName email phone role avatar isActive');
    if (!staff) throw new ApiError(404, 'Employee not found');
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

const updateStaffProfile = async (req, res, next) => {
  try {
    const { department, designation, emergencyContact, salary, address, employmentStatus } = req.body;
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { department, designation, emergencyContact, salary, address, employmentStatus },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone role');
    if (!staff) throw new ApiError(404, 'Employee not found');

    res.status(200).json({ success: true, message: 'Employee profile updated', data: staff });
  } catch (error) {
    next(error);
  }
};

const addDocument = async (req, res, next) => {
  try {
    const { name, url } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff) throw new ApiError(404, 'Employee not found');

    staff.documents.push({ name, url });
    await staff.save();

    res.status(200).json({ success: true, message: 'Document uploaded', data: staff });
  } catch (error) {
    next(error);
  }
};

const removeDocument = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) throw new ApiError(404, 'Employee not found');

    staff.documents = staff.documents.filter((d) => d._id.toString() !== req.params.docId);
    await staff.save();

    res.status(200).json({ success: true, message: 'Document removed', data: staff });
  } catch (error) {
    next(error);
  }
};

module.exports = { createStaffProfile, getAllStaff, getStaffProfile, updateStaffProfile, addDocument, removeDocument };