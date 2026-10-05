const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config({
  path: '.env.example',
});

const ADMIN_EMAIL = 'adminraju@gmail.com';
const ADMIN_PASSWORD = 'Admin@12345';

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ MongoDB connected');

    let admin = await User.findOne({
      email: ADMIN_EMAIL,
    });

    if (admin) {
      // Update existing admin
      admin.firstName = 'Hotel';
      admin.lastName = 'Super Admin';
      admin.role = 'super_admin';

      // IMPORTANT:
      // Give plaintext password here.
      // User.js pre-save middleware will hash it.
      admin.password = ADMIN_PASSWORD;

      await admin.save();

      console.log('✅ Existing admin updated successfully');
    } else {
      // IMPORTANT:
      // Do NOT hash the password here.
      // User.js pre-save middleware handles hashing.
      admin = await User.create({
        firstName: 'Hotel',
        lastName: 'Super Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'super_admin',
      });

      console.log('✅ Super admin created successfully');
    }

    console.log('');
    console.log('====================================');
    console.log('       SUPER ADMIN LOGIN');
    console.log('====================================');
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('Role:     super_admin');
    console.log('====================================');
    console.log('');

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create/update admin');
    console.error(error);

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore connection close error
    }

    process.exit(1);
  }
};

seedAdmin();