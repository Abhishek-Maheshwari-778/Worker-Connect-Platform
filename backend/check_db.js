const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/userModel');
const Job = require('./models/jobModel');
const LabourProfile = require('./models/labourProfileModel');
const ClientProfile = require('./models/clientProfileModel');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const employee = await User.findOne({ email: 'employee1@labourconnect.in' });
    console.log('--- DB TRACE (BACKEND DIR) ---');
    console.log('Employee Found:', employee ? 'YES' : 'NO');
    if (employee) {
      console.log('ID:', employee._id);
      console.log('Role:', employee.role);
      console.log('City:', employee.location?.city);
      
      const city = employee.location?.city;
      const jobsCount = await Job.countDocuments({ 'location.city': { $regex: new RegExp(city, 'i') } });
      console.log(`Jobs in ${city}:`, jobsCount);

      const workersCount = await LabourProfile.countDocuments({ assignedEmployee: employee._id });
      console.log(`Assigned Workers:`, workersCount);

      const clientsCount = await ClientProfile.countDocuments({ assignedEmployee: employee._id });
      console.log(`Assigned Clients:`, clientsCount);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

check();
