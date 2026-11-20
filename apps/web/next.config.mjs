/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'api.dicebear.com'],
  },
  async redirects() {
    return [
      // Special: Design System routes redirect to Homepage (not download)
      {
        source: '/design-system',
        destination: '/',
        permanent: false,
      },
      {
        source: '/design-system/:path*',
        destination: '/',
        permanent: false,
      },

      // -------------------------------------------------------------
      // 1. HOST AND LIVE STUDIO (Mobile-Only -> /download?from=app)
      // -------------------------------------------------------------
      { source: '/go-live', destination: '/download?from=app', permanent: false },
      { source: '/live/setup', destination: '/download?from=app', permanent: false },
      { source: '/live/setup/:path*', destination: '/download?from=app', permanent: false },
      { source: '/live/pre-live', destination: '/download?from=app', permanent: false },
      { source: '/live/studio', destination: '/download?from=app', permanent: false },
      { source: '/live/studio/:path*', destination: '/download?from=app', permanent: false },
      { source: '/live/web-studio', destination: '/download?from=app', permanent: false },
      { source: '/live/web-watch', destination: '/download?from=app', permanent: false },
      { source: '/live/center', destination: '/download?from=app', permanent: false },
      { source: '/live/end-screen', destination: '/download?from=app', permanent: false },
      { source: '/live/host-rules', destination: '/download?from=app', permanent: false },
      { source: '/live/cost-guard', destination: '/download?from=app', permanent: false },

      // -------------------------------------------------------------
      // 2. PK AND NEAR (Mobile-Only -> /download?from=app)
      // -------------------------------------------------------------
      { source: '/live/pk', destination: '/download?from=app', permanent: false },
      { source: '/live/near', destination: '/download?from=app', permanent: false },
      { source: '/near', destination: '/download?from=app', permanent: false },
      { source: '/pk', destination: '/download?from=app', permanent: false },
      { source: '/pk/:path*', destination: '/download?from=app', permanent: false },

      // -------------------------------------------------------------
      // 3. GIFTS AND WALLET (Mobile-Only -> /download?from=app)
      // -------------------------------------------------------------
      { source: '/gifts', destination: '/download?from=app', permanent: false },
      { source: '/gifts/:path*', destination: '/download?from=app', permanent: false },
      { source: '/wallet', destination: '/download?from=app', permanent: false },
      { source: '/wallet/:path*', destination: '/download?from=app', permanent: false },
      { source: '/topup', destination: '/download?from=app', permanent: false },
      { source: '/topup/:path*', destination: '/download?from=app', permanent: false },
      { source: '/vip', destination: '/download?from=app', permanent: false },
      { source: '/store', destination: '/download?from=app', permanent: false },
      { source: '/recognition', destination: '/download?from=app', permanent: false },
      { source: '/recognition/:path*', destination: '/download?from=app', permanent: false },
      { source: '/earnings', destination: '/download?from=app', permanent: false },
      { source: '/earnings/:path*', destination: '/download?from=app', permanent: false },
      { source: '/animations', destination: '/download?from=app', permanent: false },
      { source: '/animations/:path*', destination: '/download?from=app', permanent: false },

      // -------------------------------------------------------------
      // 4. SOCIAL AND COMMUNICATION (Mobile-Only -> /download?from=app)
      // -------------------------------------------------------------
      { source: '/system-notices', destination: '/download?from=app', permanent: false },
      { source: '/system-notices/:path*', destination: '/download?from=app', permanent: false },
      { source: '/notifications', destination: '/download?from=app', permanent: false },
      { source: '/notifications/:path*', destination: '/download?from=app', permanent: false },
      { source: '/square', destination: '/download?from=app', permanent: false },
      { source: '/square/:path*', destination: '/download?from=app', permanent: false },
      { source: '/fan-club', destination: '/download?from=app', permanent: false },
      { source: '/fan-club/:path*', destination: '/download?from=app', permanent: false },
      { source: '/invites', destination: '/download?from=app', permanent: false },
      { source: '/invites/:path*', destination: '/download?from=app', permanent: false },
      { source: '/create', destination: '/download?from=app', permanent: false },
      { source: '/create/:path*', destination: '/download?from=app', permanent: false },
      { source: '/video-call', destination: '/download?from=app', permanent: false },
      { source: '/video-call/:path*', destination: '/download?from=app', permanent: false },
      { source: '/user/:path*', destination: '/download?from=app', permanent: false },

      // -------------------------------------------------------------
      // 5. RANKINGS AND HOST TASKS (Mobile-Only -> /download?from=app)
      // -------------------------------------------------------------
      { source: '/ranking', destination: '/download?from=app', permanent: false },
      { source: '/ranking/:path*', destination: '/download?from=app', permanent: false },
      { source: '/daily-tasks', destination: '/download?from=app', permanent: false },
      { source: '/daily-tasks/:path*', destination: '/download?from=app', permanent: false },
      { source: '/task-level', destination: '/download?from=app', permanent: false },
      { source: '/task-level/:path*', destination: '/download?from=app', permanent: false },
      { source: '/new-host-pack', destination: '/download?from=app', permanent: false },
      { source: '/new-host-pack/:path*', destination: '/download?from=app', permanent: false },
      { source: '/host-rankings', destination: '/download?from=app', permanent: false },
      { source: '/host-rankings/:path*', destination: '/download?from=app', permanent: false },
      { source: '/event-leaderboard', destination: '/download?from=app', permanent: false },
      { source: '/event-leaderboard/:path*', destination: '/download?from=app', permanent: false },
      { source: '/earning-identity', destination: '/download?from=app', permanent: false },
      { source: '/earning-identity/:path*', destination: '/download?from=app', permanent: false },

      // -------------------------------------------------------------
      // 6. AGENCY AND FINANCIAL MANAGEMENT (Mobile-Only -> /download?from=app)
      // -------------------------------------------------------------
      { source: '/agency-management', destination: '/download?from=app', permanent: false },
      { source: '/agency-management/:path*', destination: '/download?from=app', permanent: false },
      { source: '/agent-earnings', destination: '/download?from=app', permanent: false },
      { source: '/agent-earnings/:path*', destination: '/download?from=app', permanent: false },
      { source: '/coin-seller', destination: '/download?from=app', permanent: false },
      { source: '/coin-seller/:path*', destination: '/download?from=app', permanent: false },
      { source: '/withdrawals', destination: '/download?from=app', permanent: false },
      { source: '/withdrawals/:path*', destination: '/download?from=app', permanent: false },

      // -------------------------------------------------------------
      // 7. SETTINGS AND DEVELOPMENT (Mobile-Only -> /download?from=app)
      // -------------------------------------------------------------
      { source: '/settings/blacklist', destination: '/download?from=app', permanent: false },
      { source: '/settings/blacklist/:path*', destination: '/download?from=app', permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/party/rooms',
        destination: '/api/party/rooms',
      },
      {
        source: '/party/rooms/:path*',
        destination: '/api/party/rooms/:path*',
      },
      {
        source: '/party/categories',
        destination: '/api/party/categories',
      },
      {
        source: '/party/media/:path*',
        destination: '/api/party/media/:path*',
      },
      {
        source: '/message/conversations/:path*',
        destination: '/api/message/conversations/:path*',
      },
      {
        source: '/message/conversations',
        destination: '/api/message/conversations',
      },
      {
        source: '/message/official/:path*',
        destination: '/api/message/official/:path*',
      },
      {
        source: '/message/official',
        destination: '/api/message/official',
      },
      {
        source: '/message/unread-count',
        destination: '/api/message/unread-count',
      },
      {
        source: '/message/search',
        destination: '/api/message/search',
      },
      {
        source: '/message/users/:path*',
        destination: '/api/message/users/:path*',
      },
      {
        source: '/message/media/:path*',
        destination: '/api/message/media/:path*',
      },
      {
        source: '/economy/:path*',
        destination: '/api/economy/:path*',
      },
      {
        source: '/vip/:path*',
        destination: '/api/vip/:path*',
      },
      {
        source: '/rewards/:path*',
        destination: '/api/rewards/:path*',
      },
      {
        source: '/rewards',
        destination: '/api/rewards',
      },
      {
        source: '/rankings/:path*',
        destination: '/api/rankings/:path*',
      },
      {
        source: '/honor/:path*',
        destination: '/api/honor/:path*',
      },
      {
        source: '/medals/:path*',
        destination: '/api/medals/:path*',
      },
      {
        source: '/store/categories',
        destination: '/api/store/categories',
      },
      {
        source: '/store/products',
        destination: '/api/store/products',
      },
      {
        source: '/store/products/:path*',
        destination: '/api/store/products/:path*',
      },
      {
        source: '/bag',
        destination: '/api/bag',
      },
      {
        source: '/bag/:path*',
        destination: '/api/bag/:path*',
      },
      {
        source: '/redeem/:path*',
        destination: '/api/redeem/:path*',
      },
      {
        source: '/profile/:userId/equipped',
        destination: '/api/profile/:userId/equipped',
      },
      {
        source: '/community/:path*',
        destination: '/api/community/:path*',
      },
      {
        source: '/streamer/:path*',
        destination: '/api/streamer/:path*',
      },
      {
        source: '/builder/:path*',
        destination: '/api/builder/:path*',
      },
      {
        source: '/help/:path*',
        destination: '/api/help/:path*',
      },
      {
        source: '/settings/:path*',
        destination: '/api/settings/:path*',
      },
      {
        source: '/profiles/:path*',
        destination: '/api/profiles/:path*',
      },
      {
        source: '/live/rooms/:path*',
        destination: '/api/live/rooms/:path*',
      },
      {
        source: '/live/stream/:path*',
        destination: '/api/live/stream/:path*',
      },
      {
        source: '/payments/:path*',
        destination: '/api/payments/:path*',
      },
      {
        source: '/webhooks/payments',
        destination: '/api/webhooks/payments',
      },
    ];
  },
};

export default nextConfig;
