import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://99a7f55e8df103a0bd7bd9fd72c7e9db@o4508551446331392.ingest.us.sentry.io/4508551448821760",
  tracesSampleRate: 1.0,
  // Enable performance monitoring
  integrations: [
    new Sentry.HttpClient(),
  ],
}); 