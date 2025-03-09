export interface WorkflowRequestChat {
  userPhoneNumber: string;
  programmablePhoneNumber: string;
  aiModel?: string;
  chatSlidingWindowInSecs?: number;
  waitingForUserResponseInMins?: number;
  messageHistory?: Array<any>;
  isCAN: boolean;
}

export interface WorkflowSignalMessage {
  author: string;
  message: string;
}