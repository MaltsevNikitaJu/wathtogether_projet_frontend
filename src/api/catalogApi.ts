import { apiSlice } from './baseApi';

export const catalogApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCatalog: builder.query<{ videos: Array<{ id: number; title: string; description?: string; video_url: string; poster_url?: string }> }, void>({
            query: () => '/catalog',
        }),
    }),
});

export const { useGetCatalogQuery } = catalogApi;
