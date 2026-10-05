require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Room = require('../models/Room');
const ServiceCatalog = require('../models/ServiceCatalog');
const Supplier = require('../models/Supplier');
const Staff = require('../models/Staff');
const Equipment = require('../models/Equipment');
const TransportRequest = require('../models/TransportRequest');
const LaundryRequest = require('../models/LaundryRequest');
const Deposit = require('../models/Deposit');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const LoyaltyReward = require('../models/LoyaltyReward');
const AuditLog = require('../models/AuditLog');
const Folio = require('../models/Folio');

const findUser = (email) => User.findOne({ email });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding sample data...\n');

  const admin = await findUser('admin@grandvista.com');
  const manager = await findUser('manager@grandvista.com');
  const reception = await findUser('reception@grandvista.com');
  const housekeeping = await findUser('housekeeping@grandvista.com');
  const chef = await findUser('chef@grandvista.com');
  const accounts = await findUser('accounts@grandvista.com');
  const maintenance = await findUser('maintenance@grandvista.com');
  const guest = await findUser('guest@example.com');

  if (!admin || !guest) {
    console.log('⚠️  Run node src/seeders/seedUsers.js first — demo accounts not found.');
    process.exit(1);
  }

  // ---------- ROOMS (also powers /admin/rooms and /room-status-board) ----------
  const ROOM_IMAGES = {
    single: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80', 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80'],
    double: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80'],
    twin: ['https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=900&q=80', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=80'],
    deluxe: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=80'],
    suite: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900&q=80'],
    family: ['https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=900&q=80', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80'],
    executive: ['https://images.unsplash.com/photo-1631049035182-249067d7618e?w=900&q=80', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80'],
    presidential: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=80', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80'],
  };

  const roomData = [
    { roomNumber: '101', floor: 1, roomType: 'single', capacity: 1, bedType: 'Single', pricePerNight: 2500, sizeSqm: 20, status: 'available' },
    { roomNumber: '102', floor: 1, roomType: 'double', capacity: 2, bedType: 'Queen', pricePerNight: 3500, sizeSqm: 28, status: 'occupied' },
    { roomNumber: '103', floor: 1, roomType: 'double', capacity: 2, bedType: 'Queen', pricePerNight: 3500, sizeSqm: 28, status: 'dirty' },
    { roomNumber: '201', floor: 2, roomType: 'deluxe', capacity: 2, bedType: 'King', pricePerNight: 5500, sizeSqm: 38, status: 'cleaning' },
    { roomNumber: '202', floor: 2, roomType: 'deluxe', capacity: 3, bedType: 'King', pricePerNight: 5500, sizeSqm: 38, status: 'available' },
    { roomNumber: '203', floor: 2, roomType: 'twin', capacity: 2, bedType: 'Twin', pricePerNight: 4000, sizeSqm: 30, status: 'inspection' },
    { roomNumber: '301', floor: 3, roomType: 'suite', capacity: 4, bedType: 'King', pricePerNight: 9500, sizeSqm: 60, status: 'available' },
    { roomNumber: '302', floor: 3, roomType: 'family', capacity: 5, bedType: 'Two Queens', pricePerNight: 8000, sizeSqm: 55, status: 'reserved' },
    { roomNumber: '401', floor: 4, roomType: 'executive', capacity: 2, bedType: 'King', pricePerNight: 7500, sizeSqm: 45, status: 'maintenance' },
    { roomNumber: '501', floor: 5, roomType: 'presidential', capacity: 6, bedType: 'King + Sofa Bed', pricePerNight: 18000, sizeSqm: 95, status: 'available' },
  ];
  const rooms = [];
  for (const r of roomData) {
    let room = await Room.findOne({ roomNumber: r.roomNumber });
    const images = ROOM_IMAGES[r.roomType] || ROOM_IMAGES.double;
    if (!room) {
      room = await Room.create({
        ...r,
        images,
        description: `Comfortable ${r.roomType} room with modern amenities, city or garden views, and premium furnishings.`,
        amenities: ['Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Mini Fridge', 'Rain Shower', 'Tea/Coffee Maker'],
      });
      console.log(`✅ Room ${r.roomNumber}`);
    } else if (!room.images || room.images.length === 0) {
      room.images = images;
      await room.save();
      console.log(`🖼️  Added images to existing Room ${r.roomNumber}`);
    }
    rooms.push(room);
  }

  // ---------- SERVICE CATALOG ----------
  const services = [
    { name: 'Airport Pickup', department: 'transport', description: 'One-way pickup from the airport', price: 800, isChargeable: true },
    { name: 'Airport Drop', department: 'transport', description: 'One-way drop to the airport', price: 800, isChargeable: true },
    { name: 'Extra Bed', department: 'housekeeping', description: 'Additional bed in your room', price: 800, isChargeable: true },
    { name: 'Express Laundry', department: 'housekeeping', description: 'Same-day wash and press', price: 350, isChargeable: true },
    { name: 'Late Check-out', department: 'front_desk', description: 'Check out up to 4 PM', price: 500, isChargeable: true },
    { name: 'Early Check-in', department: 'front_desk', description: 'Check in from 10 AM', price: 500, isChargeable: true },
    { name: 'Room Service Delivery', department: 'restaurant', description: 'Food delivered to your room', price: 0, isChargeable: false },
    { name: 'Spa Massage (60 min)', department: 'spa', description: 'Full body relaxation massage', price: 2200, isChargeable: true },
    { name: 'Banquet Hall Setup', department: 'events', description: 'Standard event hall arrangement', price: 15000, isChargeable: true },
    { name: 'AC Repair Visit', department: 'maintenance', description: 'In-room AC servicing', price: 0, isChargeable: false },
  ];
  for (const s of services) {
    const exists = await ServiceCatalog.findOne({ name: s.name });
    if (!exists) { await ServiceCatalog.create(s); console.log(`✅ Service: ${s.name}`); }
  }

  // ---------- SUPPLIERS ----------
  const suppliers = [
    { name: 'FreshFarm Produce', contactPerson: 'Ramesh Iyer', phone: '9812345670', email: 'orders@freshfarm.com', productsSupplied: ['Vegetables', 'Fruits'], paymentTerms: 'net_15' },
    { name: 'CleanLinen Co.', contactPerson: 'Priya Nair', phone: '9812345671', email: 'sales@cleanlinen.com', productsSupplied: ['Towels', 'Sheets', 'Pillowcases'], paymentTerms: 'net_30' },
    { name: 'SparkleSupply Chemicals', contactPerson: 'Vikram Shah', phone: '9812345672', email: 'info@sparklesupply.com', productsSupplied: ['Cleaning Materials', 'Soap', 'Shampoo'], paymentTerms: 'cash_on_delivery' },
    { name: 'ElectroFix Spares', contactPerson: 'Anil Kumar', phone: '9812345673', email: 'support@electrofix.com', productsSupplied: ['Bulbs', 'Wires', 'Spare Parts'], paymentTerms: 'net_45' },
  ];
  for (const s of suppliers) {
    const exists = await Supplier.findOne({ name: s.name });
    if (!exists) { await Supplier.create(s); console.log(`✅ Supplier: ${s.name}`); }
  }

  // ---------- STAFF PROFILES (for /manager/staff — links to existing seeded users) ----------
  const staffLinks = [
    { user: manager, department: 'administration', designation: 'General Manager', salary: 85000 },
    { user: reception, department: 'front_office', designation: 'Senior Receptionist', salary: 32000 },
    { user: housekeeping, department: 'housekeeping', designation: 'Housekeeping Supervisor', salary: 28000 },
    { user: chef, department: 'kitchen', designation: 'Head Chef', salary: 45000 },
    { user: accounts, department: 'accounts', designation: 'Accountant', salary: 38000 },
    { user: maintenance, department: 'maintenance', designation: 'Maintenance Technician', salary: 26000 },
  ];
  for (const s of staffLinks) {
    if (!s.user) continue;
    const exists = await Staff.findOne({ user: s.user._id });
    if (!exists) {
      await Staff.create({
        user: s.user._id, department: s.department, designation: s.designation,
        joiningDate: new Date('2023-01-15'), employmentStatus: 'active', salary: s.salary,
        emergencyContact: { name: 'Family Contact', relation: 'Spouse', phone: '9900000000' },
      });
      console.log(`✅ Staff profile: ${s.designation}`);
    }
  }

  // ---------- EQUIPMENT (/maintenance/equipment) ----------
  const equipment = [
    { name: 'Passenger Elevator A', category: 'elevator', location: 'Main Lobby', status: 'operational', nextServiceDue: new Date(Date.now() + 20 * 86400000) },
    { name: 'Backup Generator', category: 'generator', location: 'Basement', status: 'operational', nextServiceDue: new Date(Date.now() + 45 * 86400000) },
    { name: 'Central AC Unit 1', category: 'hvac', location: 'Rooftop', status: 'needs_service', nextServiceDue: new Date(Date.now() - 2 * 86400000) },
    { name: 'Kitchen Exhaust System', category: 'kitchen_equipment', location: 'Main Kitchen', status: 'operational', nextServiceDue: new Date(Date.now() + 30 * 86400000) },
    { name: 'Fire Alarm Panel', category: 'fire_safety', location: 'Security Room', status: 'operational', nextServiceDue: new Date(Date.now() + 60 * 86400000) },
  ];
  for (const e of equipment) {
    const exists = await Equipment.findOne({ name: e.name });
    if (!exists) { await Equipment.create(e); console.log(`✅ Equipment: ${e.name}`); }
  }

  // ---------- BOOKING + FOLIO + REVIEW + TRANSPORT + LAUNDRY + DEPOSIT ----------
  let booking = await Booking.findOne({ guest: guest._id });
  if (!booking) {
    booking = await Booking.create({
      guest: guest._id, room: rooms[1]._id, checkIn: new Date(Date.now() - 2 * 86400000), checkOut: new Date(Date.now() + 1 * 86400000),
      guests: 2, totalAmount: 10500, status: 'checked_in', paymentStatus: 'partial', advanceCollected: 5000,
      source: 'website', createdBy: guest._id, actualCheckInTime: new Date(Date.now() - 2 * 86400000),
    });
    console.log('✅ Sample booking for guest@example.com');
  }

  // Create the matching Folio document required by the Check-Out flow
  const folioExists = await Folio.findOne({ booking: booking._id });
  if (!folioExists) {
    await Folio.create({
      booking: booking._id,
      guest: guest._id,
      charges: [{ type: 'room', description: `Room ${rooms[1].roomNumber} × 3 night(s)`, amount: 10500 }],
      payments: [{ amount: 5000, method: 'upi', note: 'Advance at check-in' }],
    });
    console.log('✅ Sample folio for the demo booking');
  }

  // Transport (/receptionist/transport)
  const transportExists = await TransportRequest.findOne({ guest: guest._id });
  if (!transportExists) {
    await TransportRequest.create({
      guest: guest._id, booking: booking._id, type: 'airport_pickup',
      scheduledDateTime: new Date(Date.now() + 86400000), pickupLocation: 'Goa International Airport', dropLocation: 'GrandVista Hotel',
      cost: 800, status: 'requested', createdBy: reception?._id,
    });
    console.log('✅ Sample transport request');
  }

  // Laundry (/housekeeping/laundry)
  const laundryExists = await LaundryRequest.findOne({ guest: guest._id });
  if (!laundryExists) {
    const laundry = new LaundryRequest({
      guest: guest._id, booking: booking._id, roomNumber: rooms[1].roomNumber,
      items: [{ itemName: 'Shirt', quantity: 3, pricePerItem: 60 }, { itemName: 'Trousers', quantity: 2, pricePerItem: 80 }],
      serviceType: 'wash_and_iron', status: 'processing',
    });
    laundry.calculateTotal();
    await laundry.save();
    console.log('✅ Sample laundry request');
  }

  // Deposit (/accountant/deposits)
  const depositExists = await Deposit.findOne({ booking: booking._id });
  if (!depositExists) {
    await Deposit.create({ booking: booking._id, guest: guest._id, type: 'booking_advance', amount: 5000, method: 'upi', collectedBy: reception?._id });
    console.log('✅ Sample deposit');
  }

  // Review (/customer/reviews, /manager/reviews-complaints)
  const reviewExists = await Review.findOne({ guest: guest._id });
  if (!reviewExists) {
    await Review.create({ guest: guest._id, booking: booking._id, rating: 5, comment: 'Beautiful property, very attentive staff. The breakfast spread was outstanding!', isPublished: true });
    console.log('✅ Sample review');
  }

  // ---------- LOYALTY REWARDS (/customer/loyalty) ----------
  const rewards = [
    { name: 'Free Room Upgrade', description: 'One free tier upgrade on your next stay', pointsCost: 500, minMembershipLevel: 'Bronze' },
    { name: 'Complimentary Breakfast', description: 'Free breakfast for two, any one day of your stay', pointsCost: 300, minMembershipLevel: 'Bronze' },
    { name: '15% Off Next Stay', description: 'Discount applied automatically at booking', pointsCost: 800, minMembershipLevel: 'Silver' },
    { name: 'Late Check-out (Free)', description: 'Check out as late as 4 PM, no charge', pointsCost: 200, minMembershipLevel: 'Bronze' },
    { name: 'Spa Voucher', description: 'One complimentary 60-minute massage', pointsCost: 1200, minMembershipLevel: 'Gold' },
  ];
  for (const r of rewards) {
    const exists = await LoyaltyReward.findOne({ name: r.name });
    if (!exists) { await LoyaltyReward.create(r); console.log(`✅ Loyalty reward: ${r.name}`); }
  }

  // Give the demo guest some points so /customer/loyalty isn't empty
  if (guest.loyaltyPoints === 0) {
    guest.loyaltyPoints = 650;
    guest.membershipLevel = 'Silver';
    await guest.save();
    console.log('✅ Gave guest@example.com 650 loyalty points (Silver tier)');
  }

  // ---------- AUDIT LOG SAMPLE ENTRIES (/audit-logs) ----------
  const auditExists = await AuditLog.countDocuments();
  if (auditExists === 0) {
    await AuditLog.create([
      { user: admin._id, userName: `${admin.firstName} ${admin.lastName}`, userRole: 'super_admin', action: 'LOGIN_SUCCESS', module: 'security', description: 'Admin signed in', ipAddress: '127.0.0.1' },
      { user: manager?._id, userName: `${manager?.firstName} ${manager?.lastName}`, userRole: 'hotel_manager', action: 'ROOM_UPDATED', module: 'rooms', targetLabel: 'Room 201', description: 'Changed Room 201 price ₹5,000 → ₹5,500', oldValue: { pricePerNight: 5000 }, newValue: { pricePerNight: 5500 }, ipAddress: '127.0.0.1' },
      { user: reception?._id, userName: `${reception?.firstName} ${reception?.lastName}`, userRole: 'receptionist', action: 'DOCUMENT_VIEWED', module: 'documents', targetLabel: 'Guest ID — Guy Guest', description: 'Viewed Guest Identification: Guy Guest', ipAddress: '127.0.0.1' },
    ]);
    console.log('✅ Sample audit log entries');
  }

  console.log('\nAll sample data seeded successfully.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });