import { OllamaClient } from "./client";

export function createOllamaActivites(ollamaClient: OllamaClient) {
  return {
    ollamaChat: ollamaClient.ollamaChat.bind(ollamaClient)
  }
}