import type { SentryTrace } from "../../sentry/types";

export interface WorkflowRequestSentry {
  throwActivityError: boolean;
  throwWorkflowError: boolean;
  sentryTrace?: SentryTrace;
}