import { apiSlice } from './baseApi';

export const videosApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getVideoQuota: builder.query<{ used: number; limit: number; is_premium: boolean }, void>({
            query: () => '/videos/quota',
            providesTags: ['Videos'],
        }),
        getVideos: builder.query<{ videos: Array<{ id: number; title: string; size: number; content_type: string; status: string; created_at: string }> }, void>({
            query: () => '/videos',
            providesTags: ['Videos'],
        }),
        initVideoUpload: builder.mutation<{ uploadUrl: string; key: string; videoId: number }, { filename: string; contentType: string; size: number; title?: string }>({
            query: (data) => ({
                url: '/videos/init',
                method: 'POST',
                body: data,
            }),
        }),
        completeVideoUpload: builder.mutation<{ id: number; size: number; status: string }, number>({
            query: (videoId) => ({
                url: `/videos/${videoId}/complete`,
                method: 'POST',
            }),
            invalidatesTags: ['Videos'],
        }),
        deleteVideo: builder.mutation<{ message: string }, number>({
            query: (videoId) => ({
                url: `/videos/${videoId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Videos'],
        }),
        getVideoPlayUrl: builder.query<{ url: string }, number>({
            query: (videoId) => `/videos/${videoId}/play-url`,
        }),
    }),
});

export const {
    useGetVideoQuotaQuery,
    useGetVideosQuery,
    useInitVideoUploadMutation,
    useCompleteVideoUploadMutation,
    useDeleteVideoMutation,
    useGetVideoPlayUrlQuery,
    useLazyGetVideoPlayUrlQuery,
} = videosApi;
