import { AnthropicClient } from "./client";

export function createAnthropicActivites(anAnthropicClient: AnthropicClient) {
  return {
    anthropicCreateMessage: anAnthropicClient.anthropicCreateMessage.bind(anAnthropicClient)
  }
}