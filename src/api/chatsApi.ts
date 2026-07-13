import { apiSlice } from './baseApi';

export const chatsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
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
        getChat: builder.query<{ chat: { id: number; name: string; type: string; created_by: number; host_only_controls: boolean; allow_video: boolean } }, string | number>({
            query: (chatId) => `/chats/${chatId}`,
            providesTags: (_, __, chatId) => [{ type: 'Chats', id: chatId }],
        }),
        updateChat: builder.mutation<{ chat: { id: number; name: string; host_only_controls: boolean; allow_video: boolean } }, { chatId: string | number; name?: string; host_only_controls?: boolean; allow_video?: boolean }>({
            query: ({ chatId, ...body }) => ({
                url: `/chats/${chatId}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Chats'],
        }),
        getChatSettings: builder.query<{ settings: { notify_messages: boolean; notify_video: boolean; sound_enabled: boolean; show_participants: boolean } }, string | number>({
            query: (chatId) => `/chats/${chatId}/settings`,
        }),
        updateChatSettings: builder.mutation<{ settings: { notify_messages: boolean; notify_video: boolean; sound_enabled: boolean; show_participants: boolean } }, { chatId: string | number; notify_messages?: boolean; notify_video?: boolean; sound_enabled?: boolean; show_participants?: boolean }>({
            query: ({ chatId, ...body }) => ({
                url: `/chats/${chatId}/settings`,
                method: 'PATCH',
                body,
            }),
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
        joinChat: builder.mutation<{ message: string }, string | number>({
            query: (chatId) => ({
                url: `/chats/${chatId}/join`,
                method: 'POST',
            }),
            invalidatesTags: ['Chats', 'ChatParticipants'],
        }),
        getChatParticipants: builder.query<{ participants: Array<{ id: number; username: string; avatar_url?: string; is_creator?: boolean }> }, string | number>({
            query: (chatId) => `/chats/${chatId}/participants`,
            providesTags: (_, __, chatId) => [{ type: 'ChatParticipants', id: chatId }],
        }),
    }),
});

export const {
    useGetChatsQuery,
    useGetMessagesQuery,
    useCreateChatMutation,
    useGetChatQuery,
    useUpdateChatMutation,
    useGetChatSettingsQuery,
    useUpdateChatSettingsMutation,
    useAddChatParticipantMutation,
    useLeaveChatMutation,
    useJoinChatMutation,
    useGetChatParticipantsQuery,
} = chatsApi;
