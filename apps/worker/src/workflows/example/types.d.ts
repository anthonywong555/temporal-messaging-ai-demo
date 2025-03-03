import type { SentryTrace } from "../../sentry/types";

export interface WorkflowRequestExample {
    name: string;
    sentryTrace?: SentryTrace
}
