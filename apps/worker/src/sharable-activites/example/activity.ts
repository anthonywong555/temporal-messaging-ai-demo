import type { GreetRequest } from "./types";

const UPPER_BOUND_IN_MILLIS:number = 2000;

async function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function greet(aGreetRequest: GreetRequest): Promise<string> {
  try{
    const { name } = aGreetRequest;
    const sleepTime = Math.round(Math.random() * UPPER_BOUND_IN_MILLIS);

    console.info(`sleepTime: ${sleepTime}`);
    await timeout(sleepTime);
    console.info(`Sleep Elasped`);
    //throw new Error(`Activity Error`);
    return `Hello, ${name}!`;
  } catch(e) {
    throw e;
  }
}