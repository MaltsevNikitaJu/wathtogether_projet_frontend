import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getToken } from '../utils/token';

const baseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:3001/api',
    prepareHeaders: (headers) => {
        const token = getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery,
    tagTypes: ['User', 'Chats'],
    endpoints: (builder) => ({
        register: builder.mutation({
            query: (credentials) => ({
                url: '/auth/register',
                method: 'POST',
                body: credentials,
            }),
        }),
        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        getMe: builder.query<unknown, void>({
            query: () => '/auth/me',
            providesTags: ['User'],
        }),
        getChats: builder.query<{ chats: Array<{ id: string; name: string; type: string }> }, void>({
            query: () => '/chats',
            providesTags: ['Chats'],
        }),
        getMessages: builder.query({
            query: (chatId) => `/chats/${chatId}/messages`,
            keepUnusedDataFor: 0,
        }),
        createChat: builder.mutation({
            query: (newChat) => ({
                url: '/chats',
                method: 'POST',
                body: newChat,
            }),
            invalidatesTags: ['Chats'],
        }),
    }),
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useGetMeQuery,
    useGetChatsQuery,
    useGetMessagesQuery,
    useCreateChatMutation,
} = apiSlice;
