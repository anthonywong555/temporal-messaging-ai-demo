import { bundleWorkflowCode } from '@temporalio/worker';
import { writeFile } from 'fs/promises';
import path from 'path';
import { getEnv } from '@boilerplate/common';
export const sentryDSN = getEnv('SENTRY_DSN', '');

async function bundle() {
  const { code } = await bundleWorkflowCode({
    workflowsPath: require.resolve('../workflows/index'),
    // Uncomment this line if you planning to not use Sentry
    workflowInterceptorModules: [require.resolve('../sentry/interceptors/workflows/index')]
  });

  console.log(`sentryDSN`, sentryDSN != null);

  const codePath = path.join(__dirname, '../../dist/workflow-bundle.js');

  await writeFile(codePath, code);
  console.log(`Bundle written to ${codePath}`);
}

bundle().catch((err) => {
  console.error(err);
  process.exit(1);
});