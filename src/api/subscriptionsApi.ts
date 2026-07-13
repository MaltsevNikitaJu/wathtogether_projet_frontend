import { apiSlice } from './baseApi';

export const subscriptionsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSubscription: builder.query<{ subscription: { id: number; plan: string; status: string; is_active: boolean; start_date?: string; end_date?: string } }, void>({
            query: () => '/subscriptions/my',
            providesTags: ['User'],
        }),
        upgradeSubscription: builder.mutation<{ message: string; subscription: any }, { plan: string }>({
            query: ({ plan }) => ({
                url: '/subscriptions/upgrade',
                method: 'POST',
                body: { plan },
            }),
            invalidatesTags: ['User'],
        }),
        cancelSubscription: builder.mutation<{ message: string; subscription: any }, void>({
            query: () => ({
                url: '/subscriptions/cancel',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),
        createPayment: builder.mutation<{ confirmation_url: string; payment_id: string }, { plan: string }>({
            query: ({ plan }) => ({
                url: '/subscriptions/create-payment',
                method: 'POST',
                body: { plan },
            }),
        }),
        getPaymentStatus: builder.query<{ status: string; plan?: string }, void>({
            query: () => '/subscriptions/payment-status',
        }),
    }),
});

export const {
    useGetSubscriptionQuery,
    useUpgradeSubscriptionMutation,
    useCancelSubscriptionMutation,
    useCreatePaymentMutation,
    useGetPaymentStatusQuery,
} = subscriptionsApi;
