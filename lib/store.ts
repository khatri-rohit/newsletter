import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';

/**
 * Redux Store Configuration
 * Integrates RTK Query for automatic caching and state management
 */

export const store = configureStore({
  reducer: {
    // Add the RTK Query API reducer
    [api.reducerPath]: api.reducer,
  },
  // Add the RTK Query middleware
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

// Enable refetchOnFocus and refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
