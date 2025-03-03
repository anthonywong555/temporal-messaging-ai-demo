import { proxyActivities, proxyLocalActivities, proxySinks, workflowInfo } from '@temporalio/workflow';
import type { WorkflowRequestExample } from './types';
import type { GreetRequest } from '../../sharable-activites/example/types';
import type * as activities from '../../sharable-activites/example/activity';
import type * as SentryActivities from '../../sentry/activites';
import { SentrySinks } from '../../sentry/sinks';

const { sentry } = proxySinks<SentrySinks>();

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const { startWorkflowSpan } = proxyLocalActivities<typeof SentryActivities>({
  startToCloseTimeout: '1 minute'
})

export async function example(aRequest: WorkflowRequestExample): Promise<string> {
  sentry.captureMessage('Start of Workflow');
  const { sentryTrace } = aRequest;
  const workflowSentryTrace = sentryTrace ? await startWorkflowSpan(sentryTrace, workflowInfo()) : {
    traceHeader: '',
    baggageHeader: '',
  };

  try{

    sentry.captureMessage('Logging message 🚀');

    const greets = [];
    for(let i = 0; i < 3; i++) {
      const aGreetRequest:GreetRequest = {
        ...aRequest,
        sentryTrace: workflowSentryTrace
      }

      greets.push(greet(aGreetRequest));
    }
    const results = await Promise.all(greets);

    await greet({
      sentryTrace: workflowSentryTrace,
      name: "Howdy"
    });

    //throw new Error('Workflow Error');

    sentry.stopWorkflowSpan(workflowSentryTrace);
    return results[0];
  }catch(e) {
    sentry.captureException(workflowSentryTrace, e);
    throw e;
  }
}