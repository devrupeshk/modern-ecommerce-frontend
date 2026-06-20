const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  data?: any;
}

export class ApiError extends Error {
  status: number;
  errors?: any[];

  constructor(message: string, status: number, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Global flag to prevent infinite loops during refresh token retries
let isRefreshing = false;

export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers);
  if (options.data && !(options.data instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Crucial for receiving/sending HTTP-only cookies
  };

  if (options.data) {
    config.body = options.data instanceof FormData ? options.data : JSON.stringify(options.data);
  }

  try {
    let response = await fetch(url, config);

    // If 401 Unauthorized, try to refresh tokens automatically
    if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login') && !isRefreshing) {
      isRefreshing = true;
      try {
        console.log('Access token expired. Attempting session refresh...');
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          // Token refreshed successfully, retry the original request
          isRefreshing = false;
          response = await fetch(url, config);
        } else {
          isRefreshing = false;
          // Refresh token also invalid/expired, throw 401
        }
      } catch (refreshErr) {
        isRefreshing = false;
        console.error('Session refresh failed:', refreshErr);
      }
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // Fallback if body is not JSON
      }
      throw new ApiError(
        errorData.message || 'Something went wrong',
        response.status,
        errorData.errors
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network connection failure',
      500
    );
  }
};
