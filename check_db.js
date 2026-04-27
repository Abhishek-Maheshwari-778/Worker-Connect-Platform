const mongoose = require('mongoose');
const User = require('./backend/models/userModel');
require('dotenv').config({ path: './backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const employee = await User.findOne({ email: 'employee1@labourconnect.in' });
  console.log('Employee Found:', employee ? 'YES' : 'NO');
  if (employee) console.log('Role:', employee.role);
  process.exit();
}

check();
