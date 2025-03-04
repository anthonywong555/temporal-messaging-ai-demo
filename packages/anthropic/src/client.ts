import Anthropic from '@anthropic-ai/sdk';
import type { RequestOptions } from '@anthropic-ai/sdk/core';

export class AnthropicClient {
  client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey
    });
  }

  async anthropicCreateMessage(body: Anthropic.Messages.MessageCreateParamsNonStreaming, options?: RequestOptions):Promise<Anthropic.Messages.Message> {
    return await this.client.messages.create(body, options);
  }
}