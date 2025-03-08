const { Connection, Client } = require('@temporalio/client');
const saltedMd5 = require('salted-md5');

exports.handler = async function(context, event, callback) {
  const {
    TEMPORAL_ADDRESS, 
    TEMPORAL_NAMESPACE, 
    TEMPORAL_API_KEY_PART_1,
    TEMPORAL_API_KEY_PART_2,
    TEMPORAL_TASK_QUEUE, 
    TEMPORAL_CHAT_WORKFLOW,
    SALT,
    AI_MODEL
  } = context;
  const {From, Body, To} = event;
  try {
    const connection = await Connection.connect({
      address: TEMPORAL_ADDRESS,
      tls: true,
      apiKey: `${TEMPORAL_API_KEY_PART_1}${TEMPORAL_API_KEY_PART_2}`,
      metadata: {
        'temporal-namespace': TEMPORAL_NAMESPACE,
      }
    });

    const temporalClient = new Client({
      connection,
      namespace: TEMPORAL_NAMESPACE
    });

    const saltedHash = saltedMd5(From, SALT);

    await temporalClient.workflow.signalWithStart(TEMPORAL_CHAT_WORKFLOW, {
      taskQueue: TEMPORAL_TASK_QUEUE,
      workflowId: saltedHash,
      args: [{
        userPhoneNumber: From,
        programmablePhoneNumber: To,
        aiModel: AI_MODEL,
        chatSlidingWindowInSecs: 15,
        waitingForUserResponseInMins: 5
      }],
      signal: 'addMessage',
      signalArgs: [{
        author: 'user',
        message: Body
      }]
    });

    await connection.close();

    return callback(null, {});
  } catch(e) {
    return callback(e);
  }
};