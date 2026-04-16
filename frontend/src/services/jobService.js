// import api from './api';

// const jobService = {
//   // Public
//   getJobs:    (params) => api.get('/jobs', { params }),
//   getJobById: (id)     => api.get(`/jobs/${id}`),

//   // Client
//   createJob:  (data)     => api.post('/jobs', data),
//   updateJob:  (id, data) => api.put(`/jobs/${id}`, data),
//   deleteJob:  (id)       => api.delete(`/jobs/${id}`),
//   getMyPostings: (params) => api.get('/jobs/my-postings', { params }),
//   updateApplicantStatus: (jobId, labourId, data) =>
//     api.put(`/jobs/${jobId}/applicants/${labourId}`, data),

//   // Labour
//   applyToJob:          (id, data) => api.post(`/jobs/${id}/apply`, data),
//   withdrawApplication: (id)       => api.delete(`/jobs/${id}/apply`),
//   getMyApplications:   (params)   => api.get('/jobs/my-applications', { params }),
//   getClientHistory:    ()         => api.get('/jobs/my-client-history'),

//   // Completion
//   completeJob: (id) => api.put(`/jobs/${id}/complete`),

//   // Recommendations
//   getRecommendedJobs:      (params) => api.get('/recommendations/jobs', { params }),
//   getRecommendedLabourers: (jobId)  => api.get(`/recommendations/labourers/${jobId}`),
// };

// export default jobService;

import api from './api';

const jobService = {
  // Public
  getJobs:    (params) => api.get('/jobs', { params }),
  getJobById: (id)     => api.get(`/jobs/${id}`),

  // Client
  createJob:  (data)     => api.post('/jobs', data),
  updateJob:  (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob:  (id)       => api.delete(`/jobs/${id}`),
  getMyPostings: (params) => api.get('/jobs/my-postings', { params }),
  updateApplicantStatus: (jobId, labourId, data) =>
    api.put(`/jobs/${jobId}/applicants/${labourId}`, data),

  // Labour
  applyToJob:          (id, data) => api.post(`/jobs/${id}/apply`, data),
  withdrawApplication: (id)       => api.delete(`/jobs/${id}/apply`),
  getMyApplications:   (params)   => api.get('/jobs/my-applications', { params }),
  getClientHistory:    ()         => api.get('/jobs/my-client-history'),
  
  // Saved Jobs
  saveJob:             (id)       => api.post(`/jobs/${id}/save`),
  unsaveJob:           (id)       => api.delete(`/jobs/${id}/save`),
  getSavedJobs:        (params)   => api.get('/jobs/saved', { params }),


  // Completion
  completeJob: (id) => api.put(`/jobs/${id}/complete`),

  // Recommendations
  getRecommendedJobs:      (params) => api.get('/recommendations/jobs', { params }),
  getRecommendedLabourers: (jobId)  => api.get(`/recommendations/labourers/${jobId}`),
};

export default jobService;