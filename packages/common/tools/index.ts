export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue != null) {
      return defaultValue;
    }
    throw new Error(`missing env var: ${key}`);
  }
  return value;
}

const ENV_DEVELOPMENT = 'development';

export const env = getEnv('NODE_ENV', ENV_DEVELOPMENT);

export const isEnvDev = env === ENV_DEVELOPMENT;