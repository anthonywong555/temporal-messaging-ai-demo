import { AbortableAsyncIterator, ChatRequest, ChatResponse, Ollama } from 'ollama';

export class OllamaClient {
  client: Ollama;

  constructor(host: string) {
    this.client = new Ollama({
      host
    });
  }

  async ollamaChat(chatRequest: ChatRequest):Promise<ChatResponse> {
    return await this.client.chat({...chatRequest, stream: false});
  }
}