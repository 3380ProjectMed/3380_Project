// src/api/http.js (or src/utils/http.js)
// HTTP utility for making API requests

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} options.params - Query parameters
 * @param {Object} options.body - Request body for POST/PUT
 * @param {Object} options.headers - Additional headers
 * @returns {Promise<Object>} Response data
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    params = {},
    body = null,
    headers = {}
  } = options;

  // Build URL with query parameters
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  if (params && Object.keys(params).length > 0) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });
  }

  // Build request config
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  // Add body for POST/PUT requests
  if (body && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), config);
    
    // Parse JSON response
    const data = await response.json();
    
    // Check if response was successful
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * GET request helper
 */
export function get(endpoint, params = {}) {
  return apiRequest(endpoint, { method: 'GET', params });
}

/**
 * POST request helper
 */
export function post(endpoint, body = {}) {
  return apiRequest(endpoint, { method: 'POST', body });
}

/**
 * PUT request helper
 */
export function put(endpoint, body = {}) {
  return apiRequest(endpoint, { method: 'PUT', body });
}

/**
 * DELETE request helper
 */
export function del(endpoint, params = {}) {
  return apiRequest(endpoint, { method: 'DELETE', params });
}

export default {
  apiRequest,
  get,
  post,
  put,
  delete: del
};