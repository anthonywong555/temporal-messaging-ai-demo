import 'dotenv/config';
import { getEnv, env } from '@temporal-messaging-ai-demo/common';
import { namespace, getConnectionOptions, taskQueue, getDataConverter } from '@temporal-messaging-ai-demo/temporalio';
import { getTelemetryOptions, withOptionalStatusServer } from './env';
import { createOpenAIActivites, OpenAIClient } from '@temporal-messaging-ai-demo/openai';
import { NativeConnection, Runtime, Worker} from '@temporalio/worker';

console.info(`🤖: Node_ENV = ${env}`);

async function run() {
  try {
    console.info('🤖📞: OpenAI Worker Coming Online...');
    const connectionOptions = await getConnectionOptions(process.env);
    const telemetryOptions = getTelemetryOptions();

    if(telemetryOptions) {
      Runtime.install(telemetryOptions);
    }

    const connection = await NativeConnection.connect(connectionOptions);

    // Activities Dependency Injection
    const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
    const openAIClient = new OpenAIClient(OPENAI_API_KEY);

    const worker = await Worker.create({
      connection,
      namespace,
      taskQueue,
      activities: {...createOpenAIActivites(openAIClient)},
      dataConverter: await getDataConverter(),
    });

    const statusPort = getEnv('TEMPORAL_WORKER_STATUS_HTTP_PORT', '');

    if(statusPort) {
      await withOptionalStatusServer(worker, parseInt(statusPort), async () => {
        try {
          console.info('🤖: Temporal Worker Online! Beep Boop Beep!');
          await worker.run();
        } finally {
          await connection.close();
        }
      });
    } else {
      console.info('🤖: Temporal Worker Online! Beep Boop Beep!');
      await worker.run();
      await connection.close();
    }
  } catch (e) {
    console.error('🤖: ERROR!', e);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});