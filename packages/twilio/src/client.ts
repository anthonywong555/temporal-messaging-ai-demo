import twilio from 'twilio';

export class TwilioClient {
  client: twilio.Twilio;
  defaultPhoneNumber: string | undefined;

  constructor(accountSid: string, apiKey: string, apiSecret: string, defaultPhoneNumber?: string) {
    this.client = twilio(apiKey, apiSecret, {accountSid});
    this.defaultPhoneNumber = defaultPhoneNumber;
  }

  async createMessage(payload: any) {
    const newPayload = this.defaultPhoneNumber ? 
      {...payload, from: this.defaultPhoneNumber} : 
      payload;
    
    return await this.client.messages.create(newPayload);
  }
}