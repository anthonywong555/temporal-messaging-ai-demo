import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { getEnv, env, isEnvDev } from '@temporal-messaging-ai-demo/common';
import type { WorkerOptions } from "@temporalio/worker";

import { sentrySinks } from "./sinks";
import { SentryActivityInboundInterceptor } from "./interceptors/activites";

export const sentryDSN = getEnv('SENTRY_DSN', '');

// Check to see Sentry is declared.
if(sentryDSN) {
  Sentry.init({
    dsn: sentryDSN,
    environment: env,
    integrations: [
      nodeProfilingIntegration()
    ],
    // Add Tracing by setting tracesSampleRate
    // We recommend adjusting this value in production
    tracesSampleRate: isEnvDev ? 1.0 : parseFloat(getEnv('SENTRY_PRODUCTION_SAMPLE_RATE', '0.8')),
  
    // Set sampling rate for profiling
    // This is relative to tracesSampleRate
    profilesSampleRate: isEnvDev ? 1.0 : parseFloat(getEnv('SENTRY_PRODUCTION_SAMPLE_RATE', '0.8')),
  });

  console.info('🤖: Sentry Online 📈');
}

export function getSentryWorkerOptions(): Pick<WorkerOptions, 'sinks' | 'interceptors'> {
  return sentryDSN ? {
    sinks: {...sentrySinks()},
    interceptors: {
      activity: [(ctx) => {
        return {
          inbound: new SentryActivityInboundInterceptor(ctx)
        }
      }],
      ...(env != 'production' && env !='preview' && {
        workflowModules: [require.resolve('./interceptors/workflows/index')],
      })
    }
  } : {};
}