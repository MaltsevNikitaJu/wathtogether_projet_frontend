import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { getToken, removeToken } from '../utils/token';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
    const baseQuery = fetchBaseQuery({
        baseUrl: API_URL,
        prepareHeaders: (headers) => {
            const token = getToken();
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    });

    const result = await baseQuery(args, api, extraOptions);

    const isAuthRequest = args.url?.includes('/auth/');
    if (result.error && (result.error as FetchBaseQueryError).status === 401 && !isAuthRequest) {
        removeToken();
        window.location.href = '/login';
    }

    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['User', 'Chats', 'Friends', 'ChatParticipants', 'Videos'],
    endpoints: () => ({}),
});
