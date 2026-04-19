export function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val || val.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

export function requireEnvInProduction(name: string): string | undefined {
  const val = process.env[name];
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) return requireEnv(name);
  return val;
}

