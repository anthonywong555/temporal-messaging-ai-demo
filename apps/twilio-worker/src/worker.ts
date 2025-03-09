import 'dotenv/config';
import { getEnv, env } from '@temporal-messaging-ai-demo/common';
import { namespace, getConnectionOptions, taskQueue, getDataConverter } from '@temporal-messaging-ai-demo/temporalio';
import { getTelemetryOptions, withOptionalStatusServer } from './env';
import { createTwilioActivites, TwilioClient } from '@temporal-messaging-ai-demo/twilio';
import { NativeConnection, ResourceBasedTunerOptions, Runtime, Worker, WorkerTuner} from '@temporalio/worker';

console.info(`🤖: Node_ENV = ${env}`);

async function run() {
  try {
    console.info('📞: Twilio Worker Coming Online...');
    const connectionOptions = await getConnectionOptions(process.env);
    const telemetryOptions = getTelemetryOptions();

    if(telemetryOptions) {
      Runtime.install(telemetryOptions);
    }

    const connection = await NativeConnection.connect(connectionOptions);

    // Activities Dependency Injection
    const twilioAccountSid = getEnv('TWILIO_ACCOUNT_SID');
    const twilioAPIKey = getEnv('TWILIO_API_KEY');
    const twilioAPISecret = getEnv('TWILIO_API_SECRET');
    const twilioClient = new TwilioClient(twilioAccountSid, twilioAPIKey, twilioAPISecret);

    const maxTaskQueueActivitiesPerSecond = Number(getEnv('TEMPORAL_MAX_TASK_QUEUE_ACTIVITIES_PER_SECOND', '30'));
    const resourceBasedTunerOptions:ResourceBasedTunerOptions = {
      targetMemoryUsage: 0.7,
      targetCpuUsage: 0.7,
    };
  
    const tuner:WorkerTuner = {
      workflowTaskSlotSupplier: {
        type: 'fixed-size',
        numSlots: 0
      }, 
      activityTaskSlotSupplier: {
        type: 'resource-based',
        tunerOptions: resourceBasedTunerOptions
      }, 
      localActivityTaskSlotSupplier: {
        type: 'fixed-size',
        numSlots: 0
      }
    };

    const worker = await Worker.create({
      tuner,
      connection,
      namespace,
      taskQueue,
      maxTaskQueueActivitiesPerSecond,
      activities: {...createTwilioActivites(twilioClient)},
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