# Temporal Messaging AI Demo

This repository demonstrates how to orchestrate messaging communication with an AI using Temporal.

![](./assets/Temporal-Messaging-AI-Demo.gif)

## Prerequisite

### 💻 Local Development

- [Temporal CLI](https://docs.temporal.io/cli) or [Temporal Docker](https://github.com/temporalio/docker-compose)
- [Node](https://nodejs.org/en)
- [Turbo CLI](https://turbo.build/repo/docs/getting-started/installation#installing-turbo)

### ☁️ Cloud Development

- [Temporal Cloud](https://temporal.io/get-cloud)
- [Fly.io](https://fly.io/)

## How to get started:

1. git clone.
1. npm install
1. npm run dev

## Deploying to ☁️

### Temporal Cloud

1. Create a [Namespace](https://docs.temporal.io/namespaces).
1. Create an [API Key](https://docs.temporal.io/cloud/api-keys).
1. Take a note of the Namespace and Address. You will need it for the following step.

### Fly.io

Set the following [runtime secrets](https://fly.io/docs/apps/secrets/) in your Fly App.

| key                  | value                                        |
|----------------------|----------------------------------------------|
| NODE_ENV             | production                                   |
| TEMPORAL_ADDRESS     | < region >.<aws \| gcp>.api.temporal.io:7233 |
| TEMPORAL_NAMESPACE   | <your namespace>                             |
| TEMPORAL_AUTH_METHOD | API_KEY                                      |
| TEMPORAL_API_KEY     | <your api key>                               |

Run the following command:

```sh
./fly/deploy.sh
```

## 📋 TODOs

- [ ] Architecture Diagram
- [ ] Research on how you can deploy Fly.io runtime secrets using a bash script. 
- [ ] Support `preview` build in Local Development

## Optional TODOs
- [ ] Support VPS
- [ ] Support [Sentry](https://sentry.io/)

### Productionizing | Things to consider

* Take a look at the [Twilio Sandbox Limitations](https://www.twilio.com/docs/whatsapp/sandbox#twilio-sandbox-limitations) and set this number on to the `twilio-worker` app secrets as the *TEMPORAL_MAX_TASK_QUEUE_ACTIVITIES_PER_SECOND*.
* Consider increasing the `temporal-worker.toml` VMs *CPU* and *RAM*: CPU: performace-4x and RAM: 8GB
    * In TS, Workflows are run on separate thread pool.