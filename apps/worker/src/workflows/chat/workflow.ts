import { proxyActivities, workflowInfo, defineSignal, setHandler, condition, continueAsNew } from '@temporalio/workflow';
import type { WorkflowRequestChat, WorkflowSignalMessage } from './types';
import { createTwilioActivites } from '@temporal-messaging-ai-demo/twilio';
import { createAnthropicActivites } from '@temporal-messaging-ai-demo/anthropic-ai';
import { createOpenAIActivites } from '@temporal-messaging-ai-demo/openai';
import type Anthropic from '@anthropic-ai/sdk';

/**
 * Activities
 */
const { twilioMessageCreate } = proxyActivities<ReturnType<typeof createTwilioActivites>>({
  startToCloseTimeout: '1m',
  retry: {
    maximumInterval: '5s', // Just for demo purposes. Usually this should be larger.
    maximumAttempts: 3
  },
  taskQueue: 'twilio'
});

const { anthropicCreateMessage } = proxyActivities<ReturnType<typeof createAnthropicActivites>>({
  startToCloseTimeout: '1m',
  retry: {
    maximumInterval: '5s', // Just for demo purposes. Usually this should be larger.
    maximumAttempts: 3
  },
  taskQueue: 'anthropic'
});

const { openAICreateMessage } = proxyActivities<ReturnType<typeof createOpenAIActivites>>({
  startToCloseTimeout: '1m',
  retry: {
    maximumInterval: '5s', // Just for demo purposes. Usually this should be larger.
    maximumAttempts: 3
  },
  taskQueue: 'openai'
});

/**
 * Signals
 */
export const addMessage = defineSignal<[WorkflowSignalMessage]>('addMessage'); 

/**
 * CONSTANT
 */
export const AI_MODEL_ANTHROPIC = 'anthropic';
export const AI_MODEL_OPEN_AI = 'openai';
export const AI_MODEL_OLLAMA = 'ollama';
const TEMPORAL_REQUEST_BLOB_SIZE_IN_BYTES = 2097152;

export async function chat(aRequest: WorkflowRequestChat): Promise<void> {
  let userMessages: Array<string> = [];
  let { messageHistory = [] } = aRequest;

  // TODO: This should be read from the .env, but good enough for now.
  const { 
    aiModel = AI_MODEL_OPEN_AI, 
    chatSlidingWindowInSecs = 60, 
    waitingForUserResponseInMins = 10,
    userPhoneNumber, 
    programmablePhoneNumber 
  } = aRequest;

  // Create a Sliding Window
  // Allow users to send a chain of messages before sending over to an 🤖.
  const waitingForUserResponseCalculation = waitingForUserResponseInMins * 60 * 1000;
  const targetDeadline = Date.now() + waitingForUserResponseCalculation;
  let timer = new UpdatableTimer(targetDeadline);
  
  setHandler(addMessage, (aMessage: WorkflowSignalMessage) => {
    userMessages.push(aMessage.message);

    // Reset the sliding window to a new target deadline.
    const slidingWindowForCalculation = chatSlidingWindowInSecs * 1000;
    timer.deadline = Date.now() + slidingWindowForCalculation;
  });

  do {
    // 💤 on the sliding window.
    await timer;

    // If there's no message within the history
    // then simply end the workflow
    if(userMessages.length === 0) {
      return;
    }

    // 0. Collect the user messages.
    const userMessage = userMessages.join('\n');
    messageHistory.push({
      role: 'user',
      content: userMessage
    });

    let aiMessages = [];
    // 1. Send the message to 🤖
    switch(aiModel) {
      case AI_MODEL_ANTHROPIC:
        const anthropicResponse = await anthropicCreateMessage({
          max_tokens: 1024,
          messages: messageHistory,
          model: 'claude-3-sonnet-latest'
        });
        for(const aContent of anthropicResponse.content) {
          const aTextBlock = aContent as Anthropic.TextBlock;
          
          if(aTextBlock.text) {
            aiMessages.push(aTextBlock.text);
          }
        }
        break;
      case AI_MODEL_OPEN_AI:
        const openAIResponse = await openAICreateMessage({
          messages: messageHistory,
          model: 'chatgpt-4o-latest'
        });

        // Format the aiMessage
        for(const aChoice of openAIResponse.choices) {
          if(aChoice.message && aChoice.message.content) {
            aiMessages.push(aChoice.message.content);
          }
        }
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

    // If there's no message from 🤖.
    if(aiMessages.length === 0) {
      await twilioMessageCreate({
        to: userPhoneNumber,
        from: programmablePhoneNumber,
        body: `Sorry, but there has been an issue with the 🤖. Please try again later 🙏.`
      });

      return;
    }
    
    // 2. Send it to the 💬 Provider
    const aiMessage = aiMessages.join('\n');
    messageHistory.push({
      'role': 'assistant',
      'content': aiMessage
    })
    const outboundAIMessages = chunkString(aiMessage, 1600);

    for(const aMessage of outboundAIMessages) {
      await twilioMessageCreate({
        to: userPhoneNumber,
        from: programmablePhoneNumber,
        body: aMessage
      });
    }

    timer = new UpdatableTimer(Date.now() + waitingForUserResponseCalculation);
    userMessages = [];
  } while(!workflowInfo().continueAsNewSuggested);

  while(byteSize(aRequest) > TEMPORAL_REQUEST_BLOB_SIZE_IN_BYTES ) {
    messageHistory.shift();
  }

  await continueAsNew<typeof chat>(aRequest);
}

/**
 * Generated by Google Gemini
 * @param json 
 * @returns 
 */
function byteSize(json: any) {
  const jsonString = JSON.stringify(json);
  return new Blob([jsonString]).size;
}

/**
 * Generated by OpenAI
 * @param str 
 * @param chunkSize 
 * @returns 
 */
function chunkString(str: string, chunkSize: number = 1600): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.substring(i, i + chunkSize));
  }
  return chunks;
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