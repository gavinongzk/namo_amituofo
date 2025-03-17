// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://99a7f55e8df103a0bd7bd9fd72c7e9db@o4508551446331392.ingest.us.sentry.io/4508551448821760",

  // Enable performance monitoring
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Adjust sampling rates
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Allow ad blockers to prevent monitoring disruption
  allowUrls: [
    /https?:\/\/[^/]*namo-amituofo\.org/,
    /https?:\/\/localhost/,
  ],

  beforeSend(event) {
    // Don't send events for ignored errors
    const ignoredErrors = [
      'Failed to fetch',
      'NetworkError',
      'TypeError: Failed to fetch',
      'ChunkLoadError',
      'Network request failed',
    ];

    if (event.exception && event.exception.values) {
      const errorMessage = event.exception.values[0]?.value;
      if (errorMessage && ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
        return null;
      }
    }

    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
});
