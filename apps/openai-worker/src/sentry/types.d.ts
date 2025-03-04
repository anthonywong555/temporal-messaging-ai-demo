import type { Span } from "@sentry/node";

export interface SentryTrace {
    traceHeader: string;
    baggageHeader: string;
    span?: Span
}