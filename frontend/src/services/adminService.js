import api from './api';

const adminService = {
  getDashboard:         ()             => api.get('/admin/dashboard'),
  getAllUsers:           (params)       => api.get('/admin/users', { params }),
  toggleSuspension:     (userId, reason) => api.put(`/admin/users/${userId}/suspend`, { reason }),
  deleteUser:           (userId)        => api.delete(`/admin/users/${userId}`),
  getPendingVerifications:(params)      => api.get('/admin/verifications', { params }),
  reviewVerification:   (profileId, data) => api.put(`/admin/verifications/${profileId}`, data),
  getAllJobs:            (params)        => api.get('/admin/jobs', { params }),
  getBadgeStats:        ()              => api.get('/admin/badge-stats'),
  recalculateAllBadges: ()              => api.post('/admin/recalculate-all-badges'),
  getFlaggedRatings:    (params)        => api.get('/admin/flagged-ratings', { params }),
  unflagRating:         (id)            => api.put(`/admin/flagged-ratings/${id}/unflag`),
  deleteFlaggedRating:  (id)            => api.delete(`/admin/flagged-ratings/${id}`),
  // Fraud Detection
  getFraudJobs:         (params)        => api.get('/admin/fraud-jobs', { params }),
  getFraudStats:        ()              => api.get('/admin/fraud-stats'),
  runFraudScan:         ()              => api.post('/admin/fraud-scan'),
  reviewFraudJob:       (jobId, data)   => api.put(`/admin/fraud-jobs/${jobId}/review`, data),
  // Audit Log
  getAuditLogs:         (params)        => api.get('/admin/audit-logs', { params }),
  getAnalytics:         (params)        => api.get('/admin/analytics', { params }),
  // Inactive Users
  getInactiveUsers:     (params)        => api.get('/admin/inactive-users', { params }),
  sendReengagementEmail:(data)          => api.post('/admin/inactive-users/email', data),
  deleteGhostAccounts:  (data)          => api.post('/admin/inactive-users/delete', data),
  // Verification SLA
  getVerificationSLA:   (params)        => api.get('/admin/verification-sla', { params }),
  getAuditSummary:      ()              => api.get('/admin/audit-summary'),
  // Employee Management
  getEmployees:         ()              => api.get('/admin/employees'),
  createEmployee:       (data)          => api.post('/admin/employees', data),
  assignEmployee:       (userId, empId) => api.put(`/admin/users/${userId}/assign-employee`, { employeeId: empId }),
};

export default adminService;