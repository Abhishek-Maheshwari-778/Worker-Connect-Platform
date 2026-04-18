/*
  Extensive Seed Script for Labour Connect
  Adds: Users (12 Labours, 7 Clients, 1 Admin), LabourProfiles, ClientProfiles, 
  Jobs (Open, In Progress, Completed, Cancelled), Applications, 
  Conversations, Messages, Ratings and Disputes.
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/userModel');
const Job = require('../models/jobModel');
const { Conversation, Message } = require('../models/chatModel');
const Dispute = require('../models/disputeModel');
const LabourProfile = require('../models/labourProfileModel');
const ClientProfile = require('../models/clientProfileModel');

dotenv.config({ path: require('path').join(__dirname, '../.env') });

const seedDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/labour_connect';
        console.log(`Connecting to MongoDB at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected...');

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany();
        await LabourProfile.deleteMany();
        await ClientProfile.deleteMany();
        await Job.deleteMany();
        await Conversation.deleteMany();
        await Message.deleteMany();
        await Dispute.deleteMany();
        console.log('Existing data cleared.');

        const defaultLocation = { coordinates: [77.209, 28.613], address: 'Connaught Place', city: 'Delhi', state: 'Delhi', pincode: '110001' };

        // 1. Create Admins
        const adminUser = await User.create({
            name: 'Admin Sahab',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
            isVerified: true,
            isProfileComplete: true,
            location: defaultLocation
        });

        // 2. Create Clients
        const clientData = [
            { name: 'Mahesh Construction', email: 'client@example.com', type: 'enterprise' },
            { name: 'Sunita Sharma', email: 'sunita@example.com', type: 'individual' },
            { name: 'ABC Builders', email: 'abc@example.com', type: 'small_business' },
            { name: 'Rohan Gupta', email: 'rohan@example.com', type: 'individual' },
            { name: 'Delhi Developers', email: 'delhidev@example.com', type: 'contractor' },
            { name: 'Kisan Farms', email: 'kisan@example.com', type: 'small_business' },
            { name: 'Priya Verma', email: 'priya@example.com', type: 'individual' }
        ];

        const clients = [];
        for (let cd of clientData) {
            const user = await User.create({
                name: cd.name,
                email: cd.email,
                password: 'password123',
                role: 'client',
                isVerified: true,
                isProfileComplete: true,
                location: defaultLocation,
                phone: '9999999' + String(clients.length).padStart(3, '0')
            });
            const profile = await ClientProfile.create({
                user: user._id,
                companyName: cd.name,
                companyType: cd.type,
                averageRating: 4.5,
                totalRatings: 12,
                totalJobsPosted: 5,
                isVerified: true
            });
            user.clientProfile = profile._id;
            await user.save();
            clients.push(user);
        }

        // 3. Create Labours
        const labourData = [
            { name: 'Rajesh Kumar', email: 'labour@example.com', skills: ['painting', 'masonry'] },
            { name: 'Shankar Plumber', email: 'shankar@example.com', skills: ['plumbing'] },
            { name: 'Amit Singh', email: 'amit@example.com', skills: ['electrical', 'wiring'] },
            { name: 'Vikram Yadav', email: 'vikram@example.com', skills: ['carpentry'] },
            { name: 'Suresh Patel', email: 'suresh@example.com', skills: ['gardening'] },
            { name: 'Rani Devi', email: 'rani@example.com', skills: ['cleaning'] },
            { name: 'Rajjo Bai', email: 'rajjo@example.com', skills: ['cleaning'] },
            { name: 'Mohammad Ali', email: 'ali@example.com', skills: ['welding'] },
            { name: 'Dinesh Sharma', email: 'dinesh@example.com', skills: ['driving'] },
            { name: 'Arjun Das', email: 'arjun@example.com', skills: ['construction'] },
            { name: 'Pankaj Tiwari', email: 'pankaj@example.com', skills: ['painting'] },
            { name: 'Gita Patel', email: 'gita@example.com', skills: ['cooking'] },
        ];

        const labours = [];
        for (let ld of labourData) {
            const user = await User.create({
                name: ld.name,
                email: ld.email,
                password: 'password123',
                role: 'labour',
                isVerified: true,
                isProfileComplete: true,
                location: defaultLocation,
                phone: '8888888' + String(labours.length).padStart(3, '0'),
                avatar: { url: 'https://i.pravatar.cc/150?u=' + ld.email }
            });
            const profile = await LabourProfile.create({
                user: user._id,
                bio: `Hi, I am ${ld.name} and I have experience in ${ld.skills.join(', ')}`,
                experience: Math.floor(Math.random() * 10) + 1,
                dailyWageMin: 400 + Math.floor(Math.random() * 200),
                dailyWageMax: 700 + Math.floor(Math.random() * 300),
                skills: ld.skills.map(s => ({ name: s, yearsOfExp: Math.floor(Math.random() * 5)+1, proficiency: 'expert' })),
                averageRating: 4 + Math.random(),
                totalRatings: Math.floor(Math.random() * 50),
                completedJobs: Math.floor(Math.random() * 30),
                verificationStatus: 'approved'
            });
            user.labourProfile = profile._id;
            await user.save();
            labours.push(user);
        }

        // 4. Create Jobs
        console.log('Creating jobs...');
        const jobDefs = [
            { title: 'Urgent House Painting', desc: 'Need 2 painters for my 3 BHK apartment.', cat: 'painting', by: clients[0], s: 'open', req: [{skill: 'painting', count: 2}], b_min: 500, b_max: 800 },
            { title: 'Leaking Pipe Repair', desc: 'Kitchen sink pipe leaking heavily.', cat: 'plumbing', by: clients[1], s: 'in_progress', req: [{skill: 'plumbing', count: 1}], b_min: 300, b_max: 500, apps: [labours[1]._id], hired: [labours[1]._id] },
            { title: 'Wiring entire floor', desc: 'Need an electrician for 2 days.', cat: 'electrical', by: clients[2], s: 'completed', req: [{skill: 'electrical', count: 1}], b_min: 800, b_max: 1200, apps: [labours[2]._id], hired: [labours[2]._id] },
            { title: 'Furniture Fix', desc: 'Sofa and bed repair. Termite issues.', cat: 'carpentry', by: clients[3], s: 'cancelled', req: [{skill: 'carpentry', count: 1}], b_min: 1000, b_max: 1500 },
            { title: 'Farm Harvest Help', desc: 'Need 5 workers for wheat harvest.', cat: 'gardening', by: clients[4], s: 'open', req: [{skill: 'gardening', count: 5}], b_min: 300, b_max: 400 },
            { title: 'Monthly Cleaning Maid', desc: 'House cleaning for 1 month.', cat: 'cleaning', by: clients[5], s: 'open', req: [{skill: 'cleaning', count: 1}], b_min: 3000, b_max: 4000, type: 'fixed' },
            { title: 'Gate Welding', desc: 'Iron gate broke during shifting.', cat: 'welding', by: clients[6], s: 'completed', req: [{skill: 'welding', count: 1}], b_min: 1000, b_max: 1000, apps: [labours[7]._id], hired: [labours[7]._id] },
            { title: 'Building helper', desc: 'Brick carrying for new house construction.', cat: 'construction', by: clients[0], s: 'in_progress', req: [{skill: 'construction', count: 3}], b_min: 400, b_max: 500, apps: [labours[9]._id, labours[0]._id], hired: [labours[9]._id] }
        ];

        const jobs = [];
        for (let jd of jobDefs) {
            const j = await Job.create({
                title: jd.title,
                description: jd.desc,
                category: jd.cat,
                postedBy: jd.by._id,
                requirements: jd.req,
                totalLabourNeeded: jd.req.reduce((acc, r) => acc + r.count, 0),
                budgetMin: jd.b_min,
                budgetMax: jd.b_max,
                budgetType: jd.type || 'daily',
                startDate: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
                location: defaultLocation,
                status: jd.s,
                applicants: (jd.apps || []).map(id => ({ labour: id, status: jd.hired && jd.hired.includes(id) ? 'accepted' : 'applied' })),
                hiredLabourers: (jd.hired || []).map(id => ({ labour: id, agreedWage: jd.b_max }))
            });
            
            // Add ratings if completed
            if (jd.s === 'completed' && jd.hired) {
                j.labourRatings = jd.hired.map(id => ({ labour: id, rating: 4 + Math.round(Math.random()), review: 'Good job!' }));
                j.clientRatedByLabour = { rating: 5, review: 'Paid on time.' };
                await j.save();
            }

            jobs.push(j);
        }

        // 5. Create Disputes
        console.log('Creating disputes...');
        await Dispute.create({
            raisedBy: labours[1]._id,
            raisedByRole: 'labour',
            against: clients[1]._id,
            againstRole: 'client',
            job: jobs[1]._id,
            type: 'payment_not_made',
            title: 'Payment pending for pipe fix',
            description: 'Fixed the pipe but client did not pay 500 INR.',
            status: 'open',
            priority: 'high',
            messages: [{ sender: labours[1]._id, senderRole: 'labour', content: 'Sir please pay my pending 500 rupees.' }]
        });
        await Dispute.create({
            raisedBy: clients[2]._id,
            raisedByRole: 'client',
            against: labours[2]._id,
            againstRole: 'labour',
            job: jobs[2]._id,
            type: 'work_quality',
            title: 'Wiring is faulty',
            description: 'Half the lights do not work after he left.',
            status: 'under_review',
            priority: 'medium',
            messages: [{ sender: clients[2]._id, senderRole: 'client', content: 'The wiring you did yesterday has failed.' }]
        });
        await Dispute.create({
            raisedBy: labours[7]._id,
            raisedByRole: 'labour',
            against: clients[6]._id,
            againstRole: 'client',
            job: jobs[6]._id,
            type: 'harassment',
            title: 'Client rude behavior',
            description: 'Client was verbally abusive.',
            status: 'resolved',
            priority: 'high',
            resolution: 'favour_labour',
            resolutionNote: 'Warned client. Case closed.',
            messages: [{ sender: labours[7]._id, senderRole: 'labour', content: 'Please do not abuse me.' }]
        });

        // 6. Chats
        console.log('Creating chats...');
        const conv1 = await Conversation.create({
            participants: [labours[0]._id, clients[0]._id],
            jobRef: jobs[0]._id,
            lastMessage: { content: 'Come tomorrow', sentBy: clients[0]._id, sentAt: new Date() }
        });
        await Message.create([
            { conversation: conv1._id, sender: clients[0]._id, content: 'Can you start painting today?' },
            { conversation: conv1._id, sender: labours[0]._id, content: 'I am busy today sir.' },
            { conversation: conv1._id, sender: clients[0]._id, content: 'Come tomorrow' }
        ]);

        const conv2 = await Conversation.create({
            participants: [labours[1]._id, clients[1]._id],
            jobRef: jobs[1]._id,
            lastMessage: { content: 'I am outside', sentBy: labours[1]._id, sentAt: new Date() }
        });
        await Message.create([
            { conversation: conv2._id, sender: clients[1]._id, content: 'Pls come fast water leaking' },
            { conversation: conv2._id, sender: labours[1]._id, content: 'On my way sir' },
            { conversation: conv2._id, sender: labours[1]._id, content: 'I am outside' }
        ]);

        console.log('-------------------------------------------------------');
        console.log('✅ ALL EXTENSIVE DUMMY DATA SEEDED SUCCESSFULLY!');
        console.log('-------------------------------------------------------');
        console.log('Password for all users is: password123');
        console.log('Admin:       admin@example.com');
        console.log('Labours(12): labour@example.com, shankar@example.com, amit@example.com, vikram@example.com, ...');
        console.log('Clients(7):  client@example.com, sunita@example.com, abc@example.com, rohan@example.com, ...');
        console.log('-------------------------------------------------------');
        
        process.exit();
    } catch (err) {
        console.error('❌ SEEDING FAILED:', err);
        process.exit(1);
    }
};

seedDB();
