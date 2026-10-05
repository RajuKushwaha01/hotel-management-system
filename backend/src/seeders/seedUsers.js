require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const DEMO_PASSWORD = 'Password@123'; // meets the password policy from Part 12: 8+ chars, upper, lower, number, symbol

const ACCOUNTS = [
  { role: 'super_admin', email: 'admin@grandvista.com', firstName: 'Ava', lastName: 'Admin' },
  { role: 'hotel_manager', email: 'manager@grandvista.com', firstName: 'Mia', lastName: 'Manager' },
  { role: 'receptionist', email: 'reception@grandvista.com', firstName: 'Riya', lastName: 'Reception' },
  { role: 'housekeeping', email: 'housekeeping@grandvista.com', firstName: 'Hema', lastName: 'Housekeep' },
  { role: 'fnb_staff', email: 'fnb@grandvista.com', firstName: 'Farid', lastName: 'Server' },
  { role: 'chef', email: 'chef@grandvista.com', firstName: 'Chris', lastName: 'Chef' },
  { role: 'accountant', email: 'accounts@grandvista.com', firstName: 'Asha', lastName: 'Accounts' },
  { role: 'maintenance', email: 'maintenance@grandvista.com', firstName: 'Manoj', lastName: 'Maintain' },
  { role: 'customer', email: 'guest@example.com', firstName: 'Guy', lastName: 'Guest', phone: '9999999999' },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding demo accounts...\n');

  for (const acc of ACCOUNTS) {
    const existing = await User.findOne({ email: acc.email });
    if (existing) {
      console.log(`⏭  ${acc.email} already exists — skipped`);
      continue;
    }
    await User.create({ ...acc, password: DEMO_PASSWORD, isEmailVerified: true, isActive: true });
    console.log(`✅ Created ${acc.role.padEnd(14)} → ${acc.email}`);
  }

  console.log(`\nAll accounts use the password: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });