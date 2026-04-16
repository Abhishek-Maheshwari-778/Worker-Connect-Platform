/*
  Enhanced Seed Script for Labour Connect
  Adds: Users, Jobs, Conversations, Messages, and Disputes.
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/userModel');
const Job = require('../models/jobModel');
const { Conversation, Message } = require('../models/chatModel');
const Dispute = require('../models/disputeModel');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '../.env' });

const seedDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/labour_connect';
        console.log(`Connecting to MongoDB at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected...');

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany();
        await Job.deleteMany();
        await Conversation.deleteMany();
        await Message.deleteMany();
        await Dispute.deleteMany();
        console.log('Existing data cleared.');

        // 1. Create Users
        console.log('Creating users...');
        const users = await User.create([
            {
                name: 'Admin Sahab',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin',
                isVerified: true,
                isProfileComplete: true,
            },
            {
                name: 'Rajesh Kumar',
                email: 'labour@example.com',
                password: 'password123',
                role: 'labour',
                isVerified: true,
                isProfileComplete: true,
            },
            {
                name: 'Shankar Plumber',
                email: 'shankar@example.com',
                password: 'password123',
                role: 'labour',
                isVerified: true,
                isProfileComplete: true,
            },
            {
                name: 'Mahesh Construction',
                email: 'client@example.com',
                password: 'password123',
                role: 'client',
                isVerified: true,
                isProfileComplete: true,
            },
            {
                name: 'Sunita Sharma',
                email: 'sunita@example.com',
                password: 'password123',
                role: 'client',
                isVerified: true,
                isProfileComplete: true,
            }
        ]);

        const [admin, labour1, labour2, client1, client2] = users;
        console.log('Users created.');

        // 2. Create Jobs
        console.log('Creating jobs...');
        const jobs = await Job.create([
            {
                title: 'Urgent House Painting',
                description: 'Need 2 painters for a 3-bedroom apartment in South Delhi.',
                category: 'painting',
                postedBy: client1._id,
                requirements: [{ skill: 'painting', count: 2 }],
                totalLabourNeeded: 2,
                budgetMin: 500,
                budgetMax: 800,
                budgetType: 'daily',
                startDate: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
                location: { coordinates: [77.209, 28.613], address: 'South Delhi', city: 'Delhi', state: 'Delhi', pincode: '110001' },
                status: 'open'
            },
            {
                title: 'Leaking Pipe Repair',
                description: 'Kitchen sink pipe is leaking, need immediate fix.',
                category: 'plumbing',
                postedBy: client2._id,
                requirements: [{ skill: 'plumbing', count: 1 }],
                totalLabourNeeded: 1,
                budgetMin: 300,
                budgetMax: 500,
                budgetType: 'fixed',
                startDate: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                location: { coordinates: [77.102, 28.704], address: 'Rohini, Delhi', city: 'Delhi', state: 'Delhi', pincode: '110085' },
                status: 'in_progress'
            }
        ]);
        console.log('Jobs created.');

        // 3. Create Conversation & Messages
        console.log('Creating chats...');
        const conv = await Conversation.create({
            participants: [labour1._id, client1._id],
            jobRef: jobs[0]._id,
            lastMessage: { content: 'I am coming tomorrow at 10 AM', sentBy: labour1._id, sentAt: new Date() }
        });

        await Message.create([
            { conversation: conv._id, sender: client1._id, content: 'Hi Rajesh, are you available for the painting job?' },
            { conversation: conv._id, sender: labour1._id, content: 'Yes sir, I can do it.' },
            { conversation: conv._id, sender: client1._id, content: 'What is your daily wage?' },
            { conversation: conv._id, sender: labour1._id, content: '700 per day including materials.' },
            { conversation: conv._id, sender: labour1._id, content: 'I am coming tomorrow at 10 AM' }
        ]);
        console.log('Chats created.');

        // 4. Create Dispute
        console.log('Creating disputes...');
        await Dispute.create({
            raisedBy: labour2._id,
            raisedByRole: 'labour',
            against: client2._id,
            againstRole: 'client',
            job: jobs[1]._id,
            type: 'payment_not_made',
            title: 'Payment pending for Rohini job',
            description: 'I fixed the pipe but the client is not picking up my calls for the 500 INR payment.',
            status: 'open',
            priority: 'high',
            messages: [
                { sender: labour2._id, senderRole: 'labour', content: 'Sir please pay my pending 500 rupees.' }
            ]
        });
        console.log('Disputes created.');

        console.log('-------------------------------------------------------');
        console.log('✅ ALL DUMMY DATA SEEDED SUCCESSFULLY!');
        console.log('-------------------------------------------------------');
        console.log('Admin: admin@example.com / password123');
        console.log('Labour: labour@example.com / password123');
        console.log('Client: client@example.com / password123');
        console.log('Extra Labour: shankar@example.com / password123');
        console.log('Extra Client: sunita@example.com / password123');
        console.log('-------------------------------------------------------');
        
        process.exit();
    } catch (err) {
        console.error('❌ SEEDING FAILED:', err);
        process.exit(1);
    }
};

seedDB();
