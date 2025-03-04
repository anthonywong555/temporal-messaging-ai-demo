export interface WorkflowRequestChat {
  userPhoneNumber: string;
  programmablePhoneNumber: string;
  aiModel?: string;
  chatSlidingWindowInSecs?: number;
  waitingForUserResponseInMins?: number;
}

export interface WorkflowSignalMessage {
  author: string;
  message: string;
}