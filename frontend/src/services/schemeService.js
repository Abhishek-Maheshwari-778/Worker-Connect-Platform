import api from './api';

const schemeService = {
  /* ── Public ──────────────────────────────────────────────────────────── */

  /** Get active schemes with filters + pagination */
  getSchemes: async (params = {}) => {
    const { data } = await api.get('/schemes', { params });
    return data; // { success, data: [...], meta: { total, page, totalPages } }
  },

  /** Get distinct filter options */
  getFilterOptions: async () => {
    const { data } = await api.get('/schemes/filter-options');
    return data;
  },

  /** Get single scheme by ID */
  getSchemeById: async (id) => {
    const { data } = await api.get(`/schemes/${id}`);
    return data;
  },

  /* ── Auth required ───────────────────────────────────────────────────── */

  /** Get all schemes saved by logged-in user */
  getSavedSchemes: async () => {
    const { data } = await api.get('/schemes/saved');
    return data;
  },

  /** Save a scheme (bookmark) */
  saveScheme: async (id) => {
    const { data } = await api.post(`/schemes/${id}/save`);
    return data;
  },

  /** Remove a saved scheme */
  unsaveScheme: async (id) => {
    const { data } = await api.delete(`/schemes/${id}/save`);
    return data;
  },

  /* ── Admin ───────────────────────────────────────────────────────────── */

  /** Get ALL schemes including inactive (admin only) */
  getAllSchemesAdmin: async (params = {}) => {
    const { data } = await api.get('/schemes/admin/all', { params });
    return data;
  },

  /** Create a new scheme */
  createScheme: async (payload) => {
    const { data } = await api.post('/schemes', payload);
    return data;
  },

  /** Update an existing scheme */
  updateScheme: async (id, payload) => {
    const { data } = await api.put(`/schemes/${id}`, payload);
    return data;
  },

  /** Delete a scheme permanently */
  deleteScheme: async (id) => {
    const { data } = await api.delete(`/schemes/${id}`);
    return data;
  },

  /** Toggle isActive for a scheme */
  toggleActive: async (id) => {
    const { data } = await api.patch(`/schemes/${id}/toggle-active`);
    return data;
  },

  /** Toggle isFeatured for a scheme */
  toggleFeatured: async (id) => {
    const { data } = await api.patch(`/schemes/${id}/toggle-featured`);
    return data;
  },
};

export default schemeService;