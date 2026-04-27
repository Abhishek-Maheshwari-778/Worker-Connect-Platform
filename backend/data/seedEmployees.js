const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedEmployees = async () => {
  await connectDB();

  try {
    console.log('Seeding employees...');

    const salt = await bcrypt.genSalt(12);
    const password = await bcrypt.hash('employee123', salt);

    const employees = [
      {
        name: 'John Employee',
        email: 'employee1@labourconnect.in',
        phone: '9000000001',
        password,
        role: 'employee',
        isVerified: true,
        isProfileComplete: true,
        location: {
          type: 'Point',
          coordinates: [77.209, 28.6139], // Delhi
          address: 'Delhi Center',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001'
        }
      },
      {
        name: 'Sarah Mediator',
        email: 'employee2@labourconnect.in',
        phone: '9000000002',
        password,
        role: 'employee',
        isVerified: true,
        isProfileComplete: true,
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760], // Mumbai
          address: 'Mumbai Hub',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      }
    ];

    // Delete existing employees to avoid duplicates if run multiple times
    await User.deleteMany({ role: 'employee' });

    // Ensure we hash password manually so we set pre-save hook skip or save them normally
    // Wait, pre('save') is used in User model. We can just insertMany? No, pre('save') doesn't run on insertMany.
    // So we already hashed the password.
    await User.insertMany(employees);

    console.log('Employees seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error with data seed: ${error}`);
    process.exit(1);
  }
};

seedEmployees();
