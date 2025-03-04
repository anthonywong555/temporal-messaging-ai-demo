import { proxyActivities, workflowInfo, defineSignal, setHandler, condition, continueAsNew } from '@temporalio/workflow';
import type { WorkflowRequestChat, WorkflowSignalMessage } from './types';

export const addMessage = defineSignal<[WorkflowSignalMessage]>('addMessage'); 

export const AI_MODEL_ANTHROPIC = 'anthropic';
export const AI_MODEL_OPEN_AI = 'openai';
export const AI_MODEL_OLLAMA = 'ollama';

export async function chat(aRequest: WorkflowRequestChat): Promise<void> {
  let userMessages: Array<string> = [];

  // TODO: This should be read from the .env, but good enough for now.
  const { 
    aiModel = AI_MODEL_ANTHROPIC, 
    chatSlidingWindowInSecs = 60, 
    waitingForUserResponseInMins = 10,
    userPhoneNumber, 
    programmablePhoneNumber } = aRequest;

  // Create a Sliding Window
  // Allow users to send a chain of messages before sending over to an 🤖.
  const slidingWindowForCalculation = chatSlidingWindowInSecs * 1000;
  const targetDeadline = Date.now() + slidingWindowForCalculation;
  const timer = new UpdatableTimer(targetDeadline);
  
  setHandler(addMessage, (aMessage: WorkflowSignalMessage) => {
    userMessages.push(aMessage.message);

    // Reset the sliding window to a new target deadline.
    timer.deadline = Date.now() + slidingWindowForCalculation;
  });

  // 💤 on the sliding window.
  await timer;

  // If there's no message within the history
  // then simply end the workflow
  if(userMessages.length === 0) {
    return;
  }

  // 0. Collect the user messages.
  const userMessage = userMessages.concat('\n');

  // 1. Send the message to 🤖
  switch(aiModel) {
    case AI_MODEL_ANTHROPIC:
      break;
    case AI_MODEL_OPEN_AI:
      break;
    case AI_MODEL_OLLAMA: 
      break;
    default:
      // TODO
      // 1. Send the user the following message: "There's an internal error".
      // 2. Report an error in Sentry.
      // 3. Fail the Workflow.
      return;
  }
  
  // 2. Send it to the 💬 Provider

  // 3. Check to see if you need to do Continue As New

  //workflowInfo().continueAsNewSuggested

  // await continueAsNew<typeof chat>(aRequest);
}


// Source: https://github.com/temporalio/samples-typescript/blob/main/timer-examples/src/updatable-timer.ts
class UpdatableTimer implements PromiseLike<void> {
  deadlineUpdated = false;
  #deadline: number;
  readonly promise: Promise<void>;

  constructor(deadline: number) {
    this.#deadline = deadline;
    this.promise = this.run();
    this.promise.catch(() => {
      // avoid unhandled rejection
    });
  }

  private async run(): Promise<void> {
    /* eslint-disable no-constant-condition */
    while (true) {
      this.deadlineUpdated = false;
      if (!(await condition(() => this.deadlineUpdated, this.#deadline - Date.now()))) {
        break;
      }
    }
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  set deadline(value: number) {
    this.#deadline = value;
    this.deadlineUpdated = true;
  }

  get deadline(): number {
    return this.#deadline;
  }
}