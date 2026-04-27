const express = require('express');
const router = express.Router();
const { 
  getEmployeeStats, 
  getManagedWorkers, 
  getManagedClients, 
  getAreaJobs,
  getJobApplicants,
  acceptApplication,
  approveUser,
  updateJobStatus 
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('employee'));

router.get('/stats', getEmployeeStats);
router.get('/workers', getManagedWorkers);
router.get('/clients', getManagedClients);
router.get('/jobs', getAreaJobs);
router.get('/jobs/:jobId/applicants', getJobApplicants);
router.put('/jobs/:jobId/hire/:workerId', acceptApplication);
router.put('/jobs/:jobId/status', updateJobStatus);
router.put('/users/:userId/approve', approveUser);

module.exports = router;
