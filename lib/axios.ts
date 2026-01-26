import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Axios Instance Configuration
 * Provides centralized HTTP client with interceptors, retry logic, and error handling
 */

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth tokens, logging, etc.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp for request duration tracking
    config.headers['X-Request-Start-Time'] = Date.now().toString();

    // Add Firebase auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('firebase-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Log outgoing requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses, errors, and retries
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const startTime = parseInt(response.config.headers['X-Request-Start-Time'] as string);
    const duration = Date.now() - startTime;

    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          duration: `${duration}ms`,
          data: response.data,
        }
      );
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Log errors
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    // Handle specific error cases
    if (error.response) {
      const { status } = error.response;

      // 401 Unauthorized - Clear auth and redirect to login
      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('firebase-token');
          // You can dispatch a custom event or use your auth context
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(error);
      }

      // 429 Too Many Requests - Implement exponential backoff
      if (status === 429 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

        // Get retry-after header or use exponential backoff
        const retryAfter = error.response.headers['retry-after'];
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.min(1000 * Math.pow(2, originalRequest._retryCount), 10000);

        await new Promise((resolve) => setTimeout(resolve, delay));

        return apiClient(originalRequest);
      }

      // 5xx Server Errors - Retry with exponential backoff (max 3 retries)
      if (status >= 500 && status < 600 && originalRequest && !originalRequest._retry) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

        if (originalRequest._retryCount <= 3) {
          originalRequest._retry = true;
          const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount), 8000);

          await new Promise((resolve) => setTimeout(resolve, delay));

          return apiClient(originalRequest);
        }
      }
    }

    // Network errors - Retry once
    if (!error.response && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

/**
 * Generic API error handler
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;

    if (axiosError.response?.data) {
      return (
        axiosError.response.data.error || axiosError.response.data.message || 'An error occurred'
      );
    }

    if (axiosError.request) {
      return 'No response from server. Please check your connection.';
    }

    return axiosError.message || 'Request failed';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Type-safe API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Helper function to make type-safe API calls
 */
export async function apiRequest<T>(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: unknown,
  config?: Parameters<typeof apiClient.request>[0]
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.request<ApiResponse<T>>({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export default apiClient;
