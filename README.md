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

#### Create Apps

Run the following commands:
```sh
fly apps create temporal-worker
fly apps create twilio-worker
fly apps create [anthropic-worker | openai-worker | ollama-worker]
```

Check that the app variable name in the fly/fly.[app-name].toml file is the same name you used to create the app in the previous step:
```sh
app = 'temporal-worker-wild-surf-7014' <- this line
primary_region = 'ewr'
```

#### Deploy Secrets

Create an .env file with the following:
| key                  | value                                        |
|----------------------|----------------------------------------------|
| TEMPORAL_ADDRESS     | < region >.<aws \| gcp>.api.temporal.io:7233 |
| TEMPORAL_NAMESPACE   | <your namespace>                             |
| TEMPORAL_AUTH_METHOD | API_KEY                                      |
| TEMPORAL_API_KEY     | <your api key>                               |

Run the following command to bulk deploy run time secrets.
```sh
fly secrets import < .env -a temporal-worker
fly secrets import < .env -a twilio-worker
fly secrets import < .env -a [anthropic-worker | openai-worker | ollama-worker]
```

Deploy additional secrets for each respective app. Refer to the `.env.example` file in the apps folder.

#### Deploy Apps

Run the following commands:
```sh
fly apps deploy --config temporal-worker
fly apps deploy --config twilio-worker
fly apps deploy --config [anthropic-worker | openai-worker | ollama-worker]
```

#### Ollama

If you want to run your own Ollama, then watch the following videos on how to do this: 
- [How to Self-Host an LLM | Fly GPUs + Ollama](https://youtu.be/T1yVMs7P-Ng?si=w06-NQEO7qwvAcm8)
- [Boost Your App with Self-Hosted LLMs on Fly.io – Step-by-Step Guide](https://youtu.be/qGucJNu4CD4?si=3MhXNViUZ2EFDOwy)

After that, follow the steps above with the `ollama-worker`.

## 📋 TODOs

- [ ] Architecture Diagram
- [X] Research on how you can deploy Fly.io runtime secrets using a bash script. 
- [ ] Support `preview` build in Local Development

## Optional TODOs
- [ ] Support VPS
- [ ] Support [Sentry](https://sentry.io/)

### Productionizing | Things to consider

* Take a look at the [Twilio Sandbox Limitations](https://www.twilio.com/docs/whatsapp/sandbox#twilio-sandbox-limitations) and set this number on to the `twilio-worker` app secrets as the *TEMPORAL_MAX_TASK_QUEUE_ACTIVITIES_PER_SECOND*.
* Consider increasing the `temporal-worker.toml` VMs *CPU* and *RAM*: CPU: performace-4x and RAM: 8GB
    * In TS, Workflows are run on separate thread pool.