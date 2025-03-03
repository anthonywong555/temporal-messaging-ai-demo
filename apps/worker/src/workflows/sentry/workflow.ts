import { proxyActivities, proxyLocalActivities, proxySinks, workflowInfo } from '@temporalio/workflow';
import type { WorkflowRequestSentry } from './types';
import type * as activities from '../../sharable-activites/tools/activity';
import type * as SentryActivities from '../../sentry/activites';
import { SentrySinks } from '../../sentry/sinks';

const { sentry } = proxySinks<SentrySinks>();

const { simulateActivity, delay } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const { startWorkflowSpan } = proxyLocalActivities<typeof SentryActivities>({
  startToCloseTimeout: '1 minute'
})

export async function sentryWorkflow(aRequest: WorkflowRequestSentry): Promise<string> {
  const workflowId = workflowInfo().workflowId;
  const { sentryTrace, throwActivityError, throwWorkflowError } = aRequest;
  const workflowSentryTrace = sentryTrace ? await startWorkflowSpan(sentryTrace, workflowInfo()) : {
    traceHeader: '',
    baggageHeader: '',
  };

  try{
    await delay({ms: 5000, sentryTrace: workflowSentryTrace});
    await simulateActivity({shouldThrowError: throwActivityError, sentryTrace: workflowSentryTrace});

    if(throwWorkflowError) {
      throw new Error('Workflow Error');
    }

    //sentry.captureMessage(`End of the Workflow`);
    return 'Success';
  } catch(e) {
    await sentry.captureException(workflowSentryTrace, e);
    throw e;
  }
}