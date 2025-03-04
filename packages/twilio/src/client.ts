import twilio from 'twilio';
import type { MessageInstance, MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';

export class TwilioClient {
  client: twilio.Twilio;
  defaultPhoneNumber: string | undefined;

  constructor(accountSid: string, apiKey: string, apiSecret: string, defaultPhoneNumber?: string) {
    this.client = twilio(apiKey, apiSecret, {accountSid});
    this.defaultPhoneNumber = defaultPhoneNumber;
  }

  async createMessage(payload: MessageListInstanceCreateOptions):Promise<MessageInstance> {
    const newPayload = this.defaultPhoneNumber ? 
      {...payload, from: this.defaultPhoneNumber} : 
      payload;
    
    return await this.client.messages.create(newPayload);
  }
}