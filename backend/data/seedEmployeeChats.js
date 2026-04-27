const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/userModel');
const { Conversation, Message } = require('../models/chatModel');
const Job = require('../models/jobModel');

dotenv.config({ path: require('path').join(__dirname, '../.env') });

const seedEmployeeChats = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/labour_connect';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for Employee Chats...');

    // 1. Get employees
    const employees = await User.find({ role: 'employee' });
    if (employees.length === 0) {
      console.log('No employees found. Seed employees first.');
      process.exit();
    }

    // 2. Get some labours and clients
    const labours = await User.find({ role: 'labour' }).limit(5);
    const clients = await User.find({ role: 'client' }).limit(3);
    const jobs = await Job.find().limit(3);

    console.log('Clearing old employee conversations...');
    // We only clear conversations where one participant is an employee
    const employeeIds = employees.map(e => e._id);
    await Conversation.deleteMany({ participants: { $in: employeeIds } });

    console.log('Creating dummy mediator chats...');

    for (let emp of employees) {
      // Chat with a labour
      for (let i = 0; i < 2; i++) {
        const labour = labours[i];
        const conv = await Conversation.create({
          participants: [emp._id, labour._id],
          jobRef: jobs[i % jobs.length]._id,
          lastMessage: { 
            content: 'I have assigned you to the new job. Check your dashboard.', 
            sentBy: emp._id, 
            sentAt: new Date() 
          }
        });

        await Message.create([
          { conversation: conv._id, sender: labour._id, content: 'Sir, any new work today?' },
          { conversation: conv._id, sender: emp._id, content: 'Wait, let me check the requirements for the construction site.' },
          { conversation: conv._id, sender: labour._id, content: 'Okay sir, I am ready.' },
          { conversation: conv._id, sender: emp._id, content: 'I have assigned you to the new job. Check your dashboard.' }
        ]);
      }

      // Chat with a client
      for (let i = 0; i < 2; i++) {
        const client = clients[i];
        const conv = await Conversation.create({
          participants: [emp._id, client._id],
          jobRef: jobs[i % jobs.length]._id,
          lastMessage: { 
            content: 'We have shortlisted 3 workers for your site.', 
            sentBy: emp._id, 
            sentAt: new Date() 
          }
        });

        await Message.create([
          { conversation: conv._id, sender: client._id, content: 'Hello, did you find anyone for the painting work?' },
          { conversation: conv._id, sender: emp._id, content: 'Yes, we are reviewing 5 applications right now.' },
          { conversation: conv._id, sender: emp._id, content: 'We have shortlisted 3 workers for your site.' }
        ]);
      }
    }

    console.log('✅ Employee dummy chats seeded successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  }
};

seedEmployeeChats();
