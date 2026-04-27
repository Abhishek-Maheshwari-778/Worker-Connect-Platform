const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const User     = require('../models/userModel');
const Job      = require('../models/jobModel');
const LabourProfile = require('../models/labourProfileModel');
const ClientProfile = require('../models/clientProfileModel');

dotenv.config();

const seedMediation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for mediation seeding...');

    // 1. Find or Create Mediator (Employee)
    let employee = await User.findOne({ role: 'employee' });
    if (!employee) {
      employee = await User.create({
        name: 'Mediator Arjun',
        email: 'employee1@labourconnect.in',
        password: 'employee123',
        role: 'employee',
        isVerified: true,
        location: { city: 'Bareilly', state: 'Uttar Pradesh' }
      });
      console.log('Created new employee:', employee.email);
    }

    // 2. Assign some workers to this employee
    const workers = await User.find({ role: 'labour' }).limit(5);
    for (const worker of workers) {
      await LabourProfile.findOneAndUpdate(
        { user: worker._id },
        { assignedEmployee: employee._id },
        { upsert: true }
      );
      // Mark some as verified
      if (Math.random() > 0.5) {
        worker.isVerified = true;
        await worker.save();
      }
    }
    console.log(`Assigned ${workers.length} workers to mediator.`);

    // 3. Assign some clients to this employee
    const clients = await User.find({ role: 'client' }).limit(3);
    for (const client of clients) {
      await ClientProfile.findOneAndUpdate(
        { user: client._id },
        { assignedEmployee: employee._id },
        { upsert: true }
      );
      // Mark some as verified
      if (Math.random() > 0.5) {
        client.isVerified = true;
        await client.save();
      }
    }
    console.log(`Assigned ${clients.length} clients to mediator.`);

    // 4. Update some jobs to be in area of employee
    const jobs = await Job.find({ status: 'open' }).limit(10);
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      job.location.city = 'Bareilly'; // Match employee city
      
      // Simulate status lifecycle
      if (i === 0) job.status = 'in_progress';
      if (i === 1) job.status = 'completed';
      
      await job.save();
    }
    console.log('Updated jobs to match mediator territory and simulated lifecycle.');

    console.log('Mediation seeding complete! 🚀');
    process.exit();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedMediation();
