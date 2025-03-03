# Temporal Worker

Use the following .env names for development:

| File Name             | Environment   |
|-----------------------|---------------|
| .env                  | development   |
| .env.preview.local    | preview / uat |
| .env.production.local | production    |

Look at the `.env.example` for reference.

This app also have the [Temporal VSCode Debugger](https://marketplace.visualstudio.com/items?itemName=temporal-technologies.temporalio). In order to use it, just make sure you open this folder in VSCode. You can't use it in the root folder.

By default the `npm run dev:watch`, will push any changes to Sentry. If you want to turn this off, then simply comment out the following line:

```json
"restart": "npm run full:dev"
```