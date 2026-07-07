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
    tagTypes: ['User', 'Chats', 'Friends', 'ChatParticipants'],
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
        getChats: builder.query<{ chats: Array<{ id: number; name: string; type: string }> }, void>({
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
        addChatParticipant: builder.mutation<{ message: string }, { chatId: string | number; userId: number }>({
            query: ({ chatId, userId }) => ({
                url: `/chats/${chatId}/participants`,
                method: 'POST',
                body: { userId },
            }),
            invalidatesTags: ['ChatParticipants'],
        }),
        leaveChat: builder.mutation<{ message: string; chatDeleted?: boolean }, { chatId: string | number }>({
            query: ({ chatId }) => ({
                url: `/chats/${chatId}/participants`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Chats', 'ChatParticipants'],
        }),
        getChatParticipants: builder.query<{ participants: Array<{ id: number; username: string; avatar_url?: string }> }, string | number>({
            query: (chatId) => `/chats/${chatId}/participants`,
            providesTags: (_, __, chatId) => [{ type: 'ChatParticipants', id: chatId }],
        }),
        searchUsers: builder.query<{ users: Array<{ id: number; username: string; avatar_url?: string }> }, string>({
            query: (query) => `/users/search?query=${encodeURIComponent(query)}`,
        }),
        getFriends: builder.query<{ friends: Array<{ id: number; username: string; avatar_url?: string }> }, void>({
            query: () => '/users/friends',
            providesTags: ['Friends'],
        }),
        sendFriendRequest: builder.mutation({
            query: (data: { addresseeId: number }) => ({
                url: '/users/friend-request',
                method: 'POST',
                body: data,
            }),
        }),
        getFriendRequests: builder.query<{ requests: Array<{ id: number; requester: { id: number; username: string; avatar_url?: string }; created_at: string }> }, void>({
            query: () => '/users/friend-requests',
            providesTags: ['Friends'],
        }),
        respondFriendRequest: builder.mutation({
            query: ({ requestId, action }: { requestId: number; action: 'accept' | 'reject' }) => ({
                url: `/users/friend-request/${requestId}`,
                method: 'PATCH',
                body: { action },
            }),
            invalidatesTags: ['Friends'],
        }),
        getProfile: builder.query<{ user: { id: number; username: string; email: string; avatar_url?: string; role?: string } }, void>({
            query: () => '/users/me',
            providesTags: ['User'],
        }),
        updateProfile: builder.mutation<{ user: { id: number; username: string; email: string; avatar_url?: string; role?: string }; message: string }, { username?: string; avatar_url?: string }>({
            query: (data) => ({
                url: '/users/me',
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        getWatchHistory: builder.query<{ history: Array<{ chat_id: string; chat_name: string; last_watched: string }> }, void>({
            query: () => '/users/history',
        }),
        uploadAvatar: builder.mutation<{ message: string; avatarUrl: string }, FormData>({
            query: (formData) => ({
                url: '/users/avatar',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['User'],
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
    useAddChatParticipantMutation,
    useLeaveChatMutation,
    useGetChatParticipantsQuery,
    useSearchUsersQuery,
    useGetFriendsQuery,
    useSendFriendRequestMutation,
    useGetFriendRequestsQuery,
    useRespondFriendRequestMutation,
    useGetProfileQuery,
    useUpdateProfileMutation,
    useGetWatchHistoryQuery,
    useUploadAvatarMutation,
} = apiSlice;
