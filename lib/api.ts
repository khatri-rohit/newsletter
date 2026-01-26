import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Newsletter } from '@/services/types';

/**
 * RTK Query API Configuration
 * Provides automatic caching, refetching, and state management for API calls
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface NewslettersListResponse {
  newsletters: Newsletter[];
  hasMore: boolean;
}

export interface SubscriptionData {
  subscribed: boolean;
  email: string;
}

export interface UploadImageResponse {
  url: string;
  key: string;
}

// Define the API slice
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // Add Firebase auth token if available
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('firebase-token');
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['Newsletter', 'Subscription', 'User'],
  endpoints: (builder) => ({
    // ==========================================
    // NEWSLETTER ENDPOINTS
    // ==========================================

    getNewsletters: builder.query<
      ApiResponse<NewslettersListResponse>,
      {
        status?: 'draft' | 'published' | 'scheduled';
        limit?: number;
        startAfter?: string;
      }
    >({
      query: (params) => ({
        url: '/newsletters',
        params,
      }),
      providesTags: (result) =>
        result?.data?.newsletters
          ? [
              ...result.data.newsletters.map(({ id }) => ({ type: 'Newsletter' as const, id })),
              { type: 'Newsletter', id: 'LIST' },
            ]
          : [{ type: 'Newsletter', id: 'LIST' }],
      // Automatic refetch every 5 minutes for published newsletters
      keepUnusedDataFor: 300,
    }),

    getNewsletterBySlug: builder.query<ApiResponse<Newsletter>, string>({
      query: (slug) => `/newsletters/slug/${slug}`,
      providesTags: (result) =>
        result?.data?.id ? [{ type: 'Newsletter', id: result.data.id }] : [],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    getNewsletterById: builder.query<ApiResponse<Newsletter>, string>({
      query: (id) => `/newsletters/${id}`,
      providesTags: (result) =>
        result?.data?.id ? [{ type: 'Newsletter', id: result.data.id }] : [],
    }),

    createNewsletter: builder.mutation<
      ApiResponse<Newsletter>,
      {
        title: string;
        content: string;
        excerpt: string;
        thumbnail?: string;
        tags?: string[];
        status?: 'draft' | 'published' | 'scheduled';
        scheduledFor?: Date;
      }
    >({
      query: (body) => ({
        url: '/newsletters',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Newsletter', id: 'LIST' }],
    }),

    updateNewsletter: builder.mutation<
      ApiResponse<Newsletter>,
      {
        id: string;
        title?: string;
        content?: string;
        excerpt?: string;
        thumbnail?: string;
        tags?: string[];
        status?: 'draft' | 'published' | 'scheduled';
        scheduledFor?: Date;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/newsletters/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Newsletter', id },
        { type: 'Newsletter', id: 'LIST' },
      ],
    }),

    deleteNewsletter: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/newsletters/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Newsletter', id },
        { type: 'Newsletter', id: 'LIST' },
      ],
    }),

    publishNewsletter: builder.mutation<ApiResponse<Newsletter>, string>({
      query: (id) => ({
        url: `/newsletters/${id}/publish`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Newsletter', id },
        { type: 'Newsletter', id: 'LIST' },
      ],
    }),

    // ==========================================
    // SUBSCRIPTION ENDPOINTS
    // ==========================================

    subscribe: builder.mutation<
      ApiResponse<{ message: string }>,
      {
        email: string;
        newsletters?: string[];
      }
    >({
      query: (body) => ({
        url: '/subscribe',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Subscription', id: 'STATUS' }],
    }),

    getSubscriptionStatus: builder.query<ApiResponse<SubscriptionData>, void>({
      query: () => '/user/subscription',
      providesTags: [{ type: 'Subscription', id: 'STATUS' }],
    }),

    updateSubscription: builder.mutation<
      ApiResponse<SubscriptionData>,
      {
        newsletters?: string[];
      }
    >({
      query: (body) => ({
        url: '/user/subscription',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Subscription', id: 'STATUS' }],
    }),

    unsubscribe: builder.mutation<ApiResponse<{ message: string }>, void>({
      query: () => ({
        url: '/user/subscription',
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Subscription', id: 'STATUS' }],
    }),

    // ==========================================
    // UPLOAD ENDPOINTS
    // ==========================================

    uploadImage: builder.mutation<ApiResponse<UploadImageResponse>, FormData>({
      query: (formData) => ({
        url: '/upload/image',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Newsletter hooks
  useGetNewslettersQuery,
  useGetNewsletterBySlugQuery,
  useGetNewsletterByIdQuery,
  useCreateNewsletterMutation,
  useUpdateNewsletterMutation,
  useDeleteNewsletterMutation,
  usePublishNewsletterMutation,

  // Subscription hooks
  useSubscribeMutation,
  useGetSubscriptionStatusQuery,
  useUpdateSubscriptionMutation,
  useUnsubscribeMutation,

  // Upload hooks
  useUploadImageMutation,
} = api;
