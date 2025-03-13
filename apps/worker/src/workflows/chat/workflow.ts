import { proxyActivities, workflowInfo, defineSignal, setHandler, condition, continueAsNew, sleep } from '@temporalio/workflow';
import type { WorkflowRequestChat, WorkflowSignalMessage } from './types';
import { createTwilioActivites } from '@temporal-messaging-ai-demo/twilio';
import { createAnthropicActivites } from '@temporal-messaging-ai-demo/anthropic-ai';
import { createOpenAIActivites } from '@temporal-messaging-ai-demo/openai';
import { createOllamaActivites } from '@temporal-messaging-ai-demo/ollama';
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

const { ollamaChat } = proxyActivities<ReturnType<typeof createOllamaActivites>>({
  startToCloseTimeout: '1m',
  retry: {
    maximumInterval: '5s', // Just for demo purposes. Usually this should be larger.
    maximumAttempts: 3
  },
  taskQueue: 'ollama'
})

/**
 * Signals
 */
export const addMessage = defineSignal<[WorkflowSignalMessage]>('addMessage'); 

/**
 * CONSTANT
 */
export const AI_MODEL_ANTHROPIC = 'Anthropic';
export const AI_MODEL_OPEN_AI = 'OpenAI';
export const AI_MODEL_OLLAMA = 'Ollama';
const TEMPORAL_REQUEST_BLOB_SIZE_IN_BYTES = 2097152;
const TEMPORAL_REQUEST_BLOB_SIZE_IN_CHARACTERS = 2097152;

export async function chat(aRequest: WorkflowRequestChat): Promise<void> {
  let userMessages: Array<string> = [];
  let { messageHistory = [] } = aRequest;

  // TODO: This should be read from the .env, but good enough for now.
  const { 
    aiModel = AI_MODEL_OPEN_AI, 
    chatSlidingWindowInSecs = 60, 
    waitingForUserResponseInMins = 10,
    userPhoneNumber, 
    programmablePhoneNumber,
    isCAN
  } = aRequest;

  // Create a Sliding Window
  // Allow users to send a chain of messages before sending over to an 🤖.
  const waitingForUserResponseCalculation = waitingForUserResponseInMins * 60 * 1000;
  const targetDeadline = Date.now() + waitingForUserResponseCalculation;

  let timer = new UpdatableTimer(targetDeadline);

  if(!isCAN) {
    await twilioMessageCreate({
      to: userPhoneNumber,
      from: programmablePhoneNumber,
      body: `✅ Message Received! \n🤖 ${aiModel} is starting a new 🧵! \n📟 Beep Boop!`
    });
  }
  
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
      if(messageHistory.length > 0) {
        await twilioMessageCreate({
          to: userPhoneNumber,
          from: programmablePhoneNumber,
          body: `Closing 🧵. Good Bye 🤖👋!`
        });
      }
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
          model: 'claude-3-7-sonnet-latest'
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
        const ollamaResponse = await ollamaChat({
          model: 'llama3',
          messages: messageHistory
        });

        aiMessages.push(ollamaResponse.message.content as string);
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
    
    // The max number of characters you can send to Twilio is 1600
    const outboundAIMessages = chunkString(aiMessage, 1500);

    if(outboundAIMessages.length === 1) {
      await twilioMessageCreate({
        to: userPhoneNumber,
        from: programmablePhoneNumber,
        body: outboundAIMessages[0]
      });
    } else {
      let part = 1;
      for(const aMessage of outboundAIMessages) {
        await sleep('1s');
        await twilioMessageCreate({
          to: userPhoneNumber,
          from: programmablePhoneNumber,
          body: `${aiModel} [${part}/${outboundAIMessages.length}]\n${aMessage}`
        });
        part = part + 1;
      }
    }

    timer = new UpdatableTimer(Date.now() + waitingForUserResponseCalculation);
    userMessages = [];

    // Reducing the message history size so we can ensure the activity call 
    // doesn't fail due to Payload SIZE to Large
    while(getCharacterLength(messageHistory) > TEMPORAL_REQUEST_BLOB_SIZE_IN_BYTES ) {
      messageHistory.shift();
    }
  } while(!workflowInfo().continueAsNewSuggested);

  await continueAsNew<typeof chat>({...aRequest, isCAN: true});
}

/**
 * Generated by Google Gemini
 * @param json 
 * @returns 
 */
function getCharacterLength(json: any) {
  const jsonString = JSON.stringify(json);
  return jsonString.length;
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