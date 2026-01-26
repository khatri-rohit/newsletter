'use client';

import { Provider } from 'react-redux';
import { store } from './store';

/**
 * Redux Provider Component
 * Wraps the app with Redux store for RTK Query
 */
export function Providers({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
}
