import 'dotenv/config';
import { getSentryWorkerOptions, sentryDSN } from './sentry/instrument';
import { getEnv, env } from '@temporal-messaging-ai-demo/common';
import { namespace, getConnectionOptions, taskQueue, getDataConverter } from '@temporal-messaging-ai-demo/temporalio';
import { getWorkflowOptions, getTelemetryOptions, withOptionalStatusServer } from './env';
import * as activities from './sharable-activites';
import * as sentryActivites from './sentry/activites';
import { NativeConnection, Runtime, Worker} from '@temporalio/worker';

console.info(`🤖: Node_ENV = ${env}`);

async function run() {
  try {
    console.info('🤖: Temporal Worker Coming Online...');
    const connectionOptions = await getConnectionOptions(process.env);
    const telemetryOptions = getTelemetryOptions();

    if(telemetryOptions) {
      Runtime.install(telemetryOptions);
    }

    const connection = await NativeConnection.connect(connectionOptions);
    const worker = await Worker.create({
      connection,
      namespace,
      taskQueue,
      activities: {...activities, 
        ...(sentryDSN ? sentryActivites: {})
      },
      dataConverter: await getDataConverter(),
      ...getWorkflowOptions(),
      ...getSentryWorkerOptions()
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