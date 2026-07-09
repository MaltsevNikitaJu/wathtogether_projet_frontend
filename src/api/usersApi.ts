import { apiSlice } from './baseApi';

export const usersApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
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
            invalidatesTags: ['Friends'],
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
        removeFriend: builder.mutation<{ message: string }, number>({
            query: (friendId) => ({
                url: `/users/friends/${friendId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Friends'],
        }),
        getProfile: builder.query<{ user: { id: number; username: string; email: string; avatar_url?: string; role?: string } }, void>({
            query: () => '/users/me',
            providesTags: ['User'],
        }),
        updateProfile: builder.mutation<{ user: { id: number; username: string; email: string; avatar_url?: string | null; role?: string }; message: string }, { username?: string; avatar_url?: string | null }>({
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
    useSearchUsersQuery,
    useGetFriendsQuery,
    useSendFriendRequestMutation,
    useGetFriendRequestsQuery,
    useRespondFriendRequestMutation,
    useRemoveFriendMutation,
    useGetProfileQuery,
    useUpdateProfileMutation,
    useGetWatchHistoryQuery,
    useUploadAvatarMutation,
} = usersApi;
