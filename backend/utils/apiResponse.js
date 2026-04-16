/**
 * Unified API response helpers – use these in every controller
 * to maintain consistent response shape across the whole API.
 */

/**
 * Success response
 * @param {object} res        - Express response object
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message    - Human-readable message
 * @param {any}    data       - Payload
 * @param {object} [meta]     - Optional pagination / extra metadata
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const body = { success: true, message };
  if (data !== null)  body.data = data;
  if (meta !== null)  body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Paginated list response
 * @param {object} res
 * @param {Array}  docs       - Array of documents
 * @param {number} total      - Total matching documents
 * @param {number} page       - Current page
 * @param {number} limit      - Items per page
 * @param {string} [message]
 */
const paginatedResponse = (res, docs, total, page, limit, message = 'Data fetched') => {
  return res.status(200).json({
    success: true,
    message,
    data: docs,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Build pagination options from query string.
 * @param {object} query - req.query
 * @returns {{ page, limit, skip }}
 */
const getPaginationOptions = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || 10);
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

module.exports = { successResponse, paginatedResponse, getPaginationOptions };
