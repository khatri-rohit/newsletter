import axios from 'axios';

/**
 * Server-Side Axios Instance
 * For use in Server Components and API routes
 */

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const serverApiClient = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for server-side
serverApiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp for logging
    config.headers['X-Request-Start-Time'] = Date.now().toString();

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Server API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('[Server API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
serverApiClient.interceptors.response.use(
  (response) => {
    const startTime = parseInt(response.config.headers['X-Request-Start-Time'] as string);
    const duration = Date.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Server API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          duration: `${duration}ms`,
        }
      );
    }

    return response;
  },
  async (error) => {
    console.error('[Server API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    // Retry logic for server errors
    const originalRequest = error.config as typeof error.config & { _retryCount?: number };

    if (error.response?.status >= 500 && originalRequest && !originalRequest._retryCount) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= 2) {
        const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return serverApiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default serverApiClient;
