// Standardized API Response Format
export const createResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

// Success responses
export const successResponse = (message, data = null, meta = null) => {
  return createResponse(true, message, data, meta);
};

// Error responses
export const errorResponse = (message, data = null, meta = null) => {
  return createResponse(false, message, data, meta);
};

// Pagination response
export const paginatedResponse = (message, items, pagination) => {
  return successResponse(message, { items }, { pagination });
};

// Single item response
export const itemResponse = (message, item) => {
  return successResponse(message, { item });
};

// List response
export const listResponse = (message, items) => {
  return successResponse(message, { items });
};

// Stats response
export const statsResponse = (message, stats) => {
  return successResponse(message, { stats });
};

// Dashboard response
export const dashboardResponse = (message, dashboard) => {
  return successResponse(message, { dashboard });
};

// Profile response
export const profileResponse = (message, user, additional = {}) => {
  return successResponse(message, { user, ...additional });
};

// Auth response
export const authResponse = (message, user, token) => {
  return successResponse(message, { user, token });
};

