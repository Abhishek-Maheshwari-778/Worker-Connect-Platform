const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const LabourProfile = require('../models/labourProfileModel');
const ClientProfile = require('../models/clientProfileModel');
const Job = require('../models/jobModel');
const { successResponse } = require('../utils/apiResponse');

// @desc    Get employee dashboard stats
// @route   GET /api/employee/stats
// @access  Private (Employee)
const getEmployeeStats = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;

  // Count assigned labourers
  const totalWorkers = await LabourProfile.countDocuments({ assignedEmployee: employeeId });

  // Count assigned clients
  const totalClients = await ClientProfile.countDocuments({ assignedEmployee: employeeId });

  // Count active jobs in the area (based on employee's city)
  const employeeCity = req.user.location?.city;
  let activeJobs = 0;
  if (employeeCity) {
    activeJobs = await Job.countDocuments({
      'location.city': { $regex: new RegExp(employeeCity, 'i') },
      status: 'open'
    });
  }

  successResponse(res, 200, 'Employee stats fetched', {
    totalWorkers,
    totalClients,
    activeJobs
  });
});

// @desc    Get managed workers
// @route   GET /api/employee/workers
// @access  Private (Employee)
const getManagedWorkers = asyncHandler(async (req, res) => {
  const workers = await LabourProfile.find({ assignedEmployee: req.user._id })
    .populate('user', 'name email phone avatar')
    .sort({ createdAt: -1 });
  
  successResponse(res, 200, 'Managed workers fetched', workers);
});

// @desc    Get managed clients
// @route   GET /api/employee/clients
// @access  Private (Employee)
const getManagedClients = asyncHandler(async (req, res) => {
  const clients = await ClientProfile.find({ assignedEmployee: req.user._id })
    .populate('user', 'name email phone avatar')
    .sort({ createdAt: -1 });
  
  successResponse(res, 200, 'Managed clients fetched', clients);
});

// @desc    Get jobs in employee's area
// @route   GET /api/employee/jobs
// @access  Private (Employee)
const getAreaJobs = asyncHandler(async (req, res) => {
  const employeeCity = req.user.location?.city;
  const filter = {};
  if (employeeCity) {
    filter['location.city'] = { $regex: new RegExp(employeeCity, 'i') };
  }

  const jobs = await Job.find(filter)
    .populate('postedBy', 'name email')
    .sort({ createdAt: -1 });

  successResponse(res, 200, 'Area jobs fetched', jobs);
});

// @desc    Get applicants for a job
// @route   GET /api/employee/jobs/:jobId/applicants
// @access  Private (Employee)
const getJobApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId)
    .populate('applicants.labour', 'name email phone avatar');

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  successResponse(res, 200, 'Applicants fetched', job.applicants);
});

// @desc    Accept/Hire a worker for a job
// @route   PUT /api/employee/jobs/:jobId/hire/:workerId
// @access  Private (Employee)
const acceptApplication = asyncHandler(async (req, res) => {
  const { jobId, workerId } = req.params;
  const job = await Job.findById(jobId);

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // Find the application
  const appIndex = job.applicants.findIndex(a => a.labour.toString() === workerId);
  if (appIndex === -1) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Update status
  job.applicants[appIndex].status = 'accepted';
  
  // Add to hired labourers if not already there
  const alreadyHired = job.hiredLabourers.some(h => h.labour.toString() === workerId);
  if (!alreadyHired) {
    job.hiredLabourers.push({
      labour: workerId,
      agreedWage: job.budgetMax
    });
  }

  // Update filling status
  // This is a bit simplified, usually we'd check requirements
  job.status = 'in_progress';
  
  await job.save();

  successResponse(res, 200, 'Worker hired successfully on behalf of client', job);
});

// @desc    Approve/Verify a managed user
// @route   PUT /api/employee/users/:userId/approve
// @access  Private (Employee)
const approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Verify user belongs to employee's portfolio
  const [labour, client] = await Promise.all([
    LabourProfile.findOne({ user: userId, assignedEmployee: req.user._id }),
    ClientProfile.findOne({ user: userId, assignedEmployee: req.user._id })
  ]);

  if (!labour && !client) {
    res.status(403);
    throw new Error('This user is not assigned to you');
  }

  const user = await User.findById(userId);
  user.isVerified = true;
  await user.save();

  successResponse(res, 200, 'User approved and verified successfully');
});

// @desc    Update job status (Give/Take work management)
// @route   PUT /api/employee/jobs/:jobId/status
// @access  Private (Employee)
const updateJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { status } = req.body; // 'in_progress', 'completed', 'cancelled'

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // Check if job is in employee's area
  const employeeCity = req.user.location?.city;
  if (employeeCity && job.location?.city && job.location.city.toLowerCase() !== employeeCity.toLowerCase()) {
    res.status(403);
    throw new Error('You can only manage jobs in your assigned area');
  }

  job.status = status;
  if (status === 'completed') {
    job.endDate = new Date();
  }
  
  await job.save();

  successResponse(res, 200, `Job marked as ${status} successfully`, job);
});

module.exports = {
  getEmployeeStats,
  getManagedWorkers,
  getManagedClients,
  getAreaJobs,
  getJobApplicants,
  acceptApplication,
  approveUser,
  updateJobStatus
};
