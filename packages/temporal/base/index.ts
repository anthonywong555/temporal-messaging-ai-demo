import { Connection, Client } from '@temporalio/client';
import { getEnv } from '@temporal-messaging-ai-demo/common';
import fs from 'fs/promises';
import { getDataConverter } from '../encryption';

export const namespace = getEnv('TEMPORAL_NAMESPACE', 'default');
export const taskQueue = getEnv('TEMPORAL_TASK_QUEUE', 'turbo-repo');
export const url = getEnv('TEMPORAL_BASE_URL', 'http://localhost:8080');

interface ConnectionOptions {
  address: string
  apiKey?: string,
  tls?: any,
  metadata: any
}

export async function getConnectionOptions(env?: any): Promise<ConnectionOptions> {
  let connectionOptions:ConnectionOptions = {
    address: env ? 
      env.TEMPORAL_ADDRESS : 
      getEnv('TEMPORAL_ADDRESS', 'localhost:7233'),
    metadata: {
        'temporal-namespace': namespace,
      },
  };

  if (env.TEMPORAL_AUTH_METHOD === 'CERT') {
    console.info('🤖: Connecting to Temporal Cloud ⛅ via Certificate');
    const crt = await fs.readFile(
      env ?
      env.TEMPORAL_CLIENT_CERT_PATH : getEnv("TEMPORAL_CLIENT_CERT_PATH"));

    const key = await fs.readFile(
      env ? 
      env.TEMPORAL_CLIENT_KEY_PATH : getEnv("TEMPORAL_CLIENT_KEY_PATH"));

    connectionOptions.tls = { clientCertPair: { crt, key } };
  } else if(env.TEMPORAL_AUTH_METHOD === 'API_KEY') {
    console.info('🤖: Connecting to Temporal Cloud ⛅ via API Key 🔑.');
    connectionOptions.apiKey = env ? 
      env.TEMPORAL_API_KEY : 
      getEnv('TEMPORAL_API_KEY');
    connectionOptions.tls = true;
  } else {
    console.info('🤖: Connecting to Local Temporal'); 
  }

  return connectionOptions;
}

export function getDeadline(durationInMs?: number) {
  const paddingDuration = durationInMs ? durationInMs : parseInt(
    getEnv('TEMPORAL_DEADLINE', '3000')
  );

  return Date.now() + paddingDuration;
}

export async function connectToTemporal(env?: any, encryption = false) {
  return new Client({
    connection: await Connection.connect(await getConnectionOptions(env)).catch((err) => {
      console.error('Error connecting to Temporal Server: ', err)
      return undefined
    }),
    namespace: env ? env.TEMPORAL_NAMESPACE : namespace,
    ...(encryption && {dataConverter: await getDataConverter()})
  });
};