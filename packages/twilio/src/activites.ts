import { TwilioClient } from "./client";

export function createTwilioActivites(twilioClient: TwilioClient) {
  return {
    twilioMessageCreate: twilioClient.createMessage.bind(twilioClient)
  }
}