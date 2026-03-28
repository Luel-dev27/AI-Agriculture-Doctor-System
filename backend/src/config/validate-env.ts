type EnvironmentValues = Record<string, string | undefined>;

function requireValue(
  env: EnvironmentValues,
  key: string,
  fallback?: string,
): string {
  const value = env[key] ?? fallback;

  if (!value || !value.trim()) {
    throw new Error(`Environment variable ${key} is required.`);
  }

  return value.trim();
}

function requirePort(env: EnvironmentValues, key: string, fallback: string) {
  const value = requireValue(env, key, fallback);
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Environment variable ${key} must be a valid port number.`);
  }

  return String(port);
}

function requireUrl(
  env: EnvironmentValues,
  key: string,
  fallback?: string,
): string {
  const value = requireValue(env, key, fallback);

  try {
    new URL(value);
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL.`);
  }

  return value;
}

export function validateEnv(env: EnvironmentValues) {
  const nodeEnv = requireValue(env, 'NODE_ENV', 'development');

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(
      'Environment variable NODE_ENV must be development, test, or production.',
    );
  }

  const jwtSecret = requireValue(env, 'JWT_SECRET', 'change-me');

  if (nodeEnv === 'production' && jwtSecret === 'change-me') {
    throw new Error(
      'JWT_SECRET must be changed from the default value in production.',
    );
  }

  return {
    ...env,
    NODE_ENV: nodeEnv,
    PORT: requirePort(env, 'PORT', '3000'),
    DATABASE_URL: requireValue(
      env,
      'DATABASE_URL',
      'postgresql://postgres:postgres@localhost:5434/agri_doctor?schema=public',
    ),
    JWT_SECRET: jwtSecret,
    FRONTEND_ORIGIN: requireUrl(
      env,
      'FRONTEND_ORIGIN',
      'http://localhost:5173',
    ),
    PUBLIC_API_URL: requireUrl(
      env,
      'PUBLIC_API_URL',
      'http://localhost:3000',
    ),
    UPLOAD_DIR: requireValue(env, 'UPLOAD_DIR', 'uploads'),
  };
}
