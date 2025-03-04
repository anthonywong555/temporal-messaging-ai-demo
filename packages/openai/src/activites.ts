import { OpenAIClient } from "./client";

export function createOpenAIActivites(anOpenAIClient: OpenAIClient) {
  return {
    openAICreateMessage: anOpenAIClient.openAICreateMessage.bind(anOpenAIClient)
  }
}