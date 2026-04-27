const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const User     = require('../models/userModel');
const Job      = require('../models/jobModel');
const LabourProfile = require('../models/labourProfileModel');
const ClientProfile = require('../models/clientProfileModel');
const { Conversation, Message } = require('../models/chatModel');

dotenv.config();

const seedEverything = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for TOTAL RESET seeding...');

    // 1. Clear All Collections
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      LabourProfile.deleteMany({}),
      ClientProfile.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({})
    ]);
    console.log('Cleared all previous data.');

    // 2. Create Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    // 3. Create Mediators (Employees) across areas
    const areas = [
      { city: 'Bareilly', state: 'Uttar Pradesh', name: 'Arjun Mehta', email: 'employee1@labourconnect.in' },
      { city: 'Delhi', state: 'Delhi', name: 'Priya Sharma', email: 'employee2@labourconnect.in' },
      { city: 'Mumbai', state: 'Maharashtra', name: 'Ravi Kumar', email: 'employee3@labourconnect.in' }
    ];

    const mediators = [];
    for (const area of areas) {
      const emp = await User.create({
        name: area.name,
        email: area.email,
        password: 'employee123',
        role: 'employee',
        isVerified: true,
        location: { city: area.city, state: area.state }
      });
      mediators.push(emp);
    }
    console.log(`Created ${mediators.length} Mediators in Bareilly, Delhi, and Mumbai.`);

    // 4. Create Clients and Workers per area
    for (const mediator of mediators) {
      const city = mediator.location.city;
      const mediatorId = mediator._id;
      
      console.log(`\n--- Seeding portfolio for Mediator: ${mediator.name} (${city}) ---`);
      
      // Create 3 Clients per Mediator (Total 9)
      for (let i = 1; i <= 3; i++) {
        const client = await User.create({
          name: `Client ${i} (${city})`,
          email: `client.${city.toLowerCase()}${i}@example.com`,
          password: 'password123',
          role: 'client',
          isVerified: true,
          location: { city, state: mediator.location.state }
        });

        const clientProfile = await ClientProfile.create({
          user: client._id,
          companyName: `${city} ${['Enterprises', 'Builders', 'Solutions'][i-1]}`,
          assignedEmployee: mediatorId,
          isVerified: true,
          companyType: 'small_business'
        });
        
        console.log(`  + Created Client: ${client.email} | Assigned to: ${mediator.email}`);

        // --- ADDED: Seed Client-Mediator Chat ---
        const clientConv = await Conversation.create({
          participants: [mediatorId, client._id],
          type: 'direct'
        });
        const clientMsgs = [
          { sender: client._id, content: `Hello, I am ${client.name}. I need to hire some workers for my new project in ${city}.` },
          { sender: mediatorId, content: `Hi ${client.name}, I'm your assigned mediator. I can certainly help you with that. I'll check my portfolio of verified workers.` },
          { sender: client._id, content: `Great! I've already posted some jobs. Please let me know when you find someone suitable.` }
        ];
        for (const msg of clientMsgs) {
          await Message.create({
            conversation: clientConv._id,
            sender: msg.sender,
            content: msg.content,
            readBy: [{ user: (msg.sender.toString() === mediatorId.toString() ? client._id : mediatorId) }]
          });
        }

        // Create 10 Jobs for each client (Total 30 per area)
        const categories = ['construction', 'electrical', 'plumbing', 'painting', 'carpentry', 'welding', 'cleaning', 'gardening', 'moving', 'security'];
        for (let j = 0; j < 10; j++) {
          const status = j % 3 === 0 ? 'open' : (j % 3 === 1 ? 'in_progress' : 'completed');
          const job = await Job.create({
            title: `${categories[j % categories.length].charAt(0).toUpperCase() + categories[j % categories.length].slice(1)} needed in ${city}`,
            description: `Professional ${categories[j % categories.length]} services required for a medium-scale project in ${city}. The project is fully managed by our area mediator to ensure quality and timely payment.`,
            category: categories[j % categories.length],
            budgetMin: 2000 + (j * 500),
            budgetMax: 5000 + (j * 500),
            budgetType: 'fixed',
            totalLabourNeeded: 1,
            location: {
              type: 'Point',
              coordinates: [0, 0],
              address: `${['Main Road', 'Sector 5', 'Old City', 'Green Park', 'Industrial Area'][j % 5]}, ${city}`,
              city,
              state: mediator.location.state
            },
            postedBy: client._id,
            status,
            startDate: new Date(),
            endDate: status === 'completed' ? new Date() : undefined,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          });

          if (status === 'open') {
            const worker = await User.findOne({ role: 'labour', 'location.city': city });
            if (worker) {
              job.applicants.push({
                labour: worker._id,
                status: 'applied',
                proposalMsg: "Ready to work! I have experience in this category."
              });
              await job.save();
            }
          }
        }
      }

      // Create 5 Workers per Mediator (Total 15)
      for (let i = 1; i <= 5; i++) {
        const worker = await User.create({
          name: `Worker ${i} (${city})`,
          email: `worker.${city.toLowerCase()}${i}@example.com`,
          password: 'password123',
          role: 'labour',
          isVerified: (i % 2 === 0),
          location: { city, state: mediator.location.state }
        });

        await LabourProfile.create({
          user: worker._id,
          skills: [{ name: ['Masonry', 'Plumbing', 'Cleaning', 'Security', 'Welding'][i-1], yearsOfExp: i }],
          assignedEmployee: mediatorId,
          isVerified: (i % 2 === 0),
          experience: i
        });

        console.log(`  + Created Worker: ${worker.email} | Assigned to: ${mediator.email}`);

        // Seed Worker-Mediator Chat History
        const workerConv = await Conversation.create({
          participants: [mediatorId, worker._id],
          type: 'direct'
        });
        const workerMsgs = [
          { sender: mediatorId, content: `Hi ${worker.name}, I am your mediator for the ${city} area. I've added you to my portfolio.` },
          { sender: worker._id, content: `Thank you sir. Please let me know if there are any jobs available for me.` },
          { sender: mediatorId, content: `Sure, just make sure your profile is updated with your latest skills.` },
          { sender: worker._id, content: `Yes sir, I've already added my experience in ${['Masonry', 'Plumbing', 'Cleaning', 'Security', 'Welding'][i-1]}.` }
        ];
        for (const msg of workerMsgs) {
          await Message.create({
            conversation: workerConv._id,
            sender: msg.sender,
            content: msg.content,
            readBy: [{ user: (msg.sender.toString() === mediatorId.toString() ? worker._id : mediatorId) }]
          });
        }
      }
    }

    console.log('\n-------------------------------------------');
    console.log('EXTENSIVE MULTI-AREA SEEDING COMPLETE! 🚀');
    console.log('Mediators: 3 | Clients: 9 | Workers: 15 | Jobs: 27');
    console.log('Data distributed across Bareilly, Delhi, and Mumbai.');
    console.log('IMPORTANT: Please LOGOUT and LOGIN AGAIN to see updated data.');
    console.log('-------------------------------------------');

    process.exit();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedEverything();
