import type { NextWebVitalsMetric } from 'next/app';

type MetricType = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';

interface BaseMetric {
  id: string;
  startTime: number;
  value: number;
  metricName: MetricType;
}

interface ExtendedMetric extends BaseMetric {
  label: string;
  name: string;
}

const thresholds = {
  CLS: 0.1,    // Cumulative Layout Shift
  FCP: 1800,   // First Contentful Paint (ms)
  FID: 100,    // First Input Delay (ms)
  INP: 200,    // Interaction to Next Paint (ms)
  LCP: 2500,   // Largest Contentful Paint (ms)
  TTFB: 800,   // Time to First Byte (ms)
};

export function reportWebVitals(metric: NextWebVitalsMetric) {
  const extendedMetric = metric as ExtendedMetric;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vital: ${extendedMetric.name}`, {
      value: extendedMetric.value,
      threshold: thresholds[extendedMetric.metricName],
      passes: extendedMetric.value <= thresholds[extendedMetric.metricName],
    });
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    const body = JSON.stringify({
      metric_name: extendedMetric.name,
      value: extendedMetric.value,
      id: extendedMetric.id,
      page: window.location.pathname,
      passes: extendedMetric.value <= thresholds[extendedMetric.metricName],
    });

    // Use Navigator.sendBeacon() for better reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics', body);
    } else {
      fetch('/api/metrics', {
        body,
        method: 'POST',
        keepalive: true,
      });
    }
  }
}

export function measureInteraction(name: string) {
  return {
    start: () => performance.mark(`${name}-start`),
    end: () => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name).pop();
      if (measure && process.env.NODE_ENV === 'development') {
        console.log(`Interaction Timing - ${name}:`, Math.round(measure.duration), 'ms');
      }
    },
  };
}

// Example usage:
// const timing = measureInteraction('search-input');
// timing.start();
// // ... perform search
// timing.end(); 