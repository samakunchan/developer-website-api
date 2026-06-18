/**
 * OpenBao Secret Loader
 * Fetches secrets from OpenBao using AppRole authentication and populates process.env
 */

import 'dotenv/config';

let secretsLoaded = false;

export async function loadSecrets() {
  if (secretsLoaded) return;

  const addr = process.env.BAO_ADDR || 'http://localhost:8200';
  const roleId = process.env.BAO_ROLE_ID;
  const secretId = process.env.BAO_SECRET_ID;
  const path = process.env.BAO_PATH;

  if (!roleId || !secretId || !path) {
    console.warn('⚠️ OpenBao configuration missing (BAO_ROLE_ID, BAO_SECRET_ID, or BAO_PATH). Skipping secret loading.');
    return;
  }

  try {
    console.log('🔐 OpenBao: Authenticating via AppRole...');

    // 1. Login to get a client token
    const loginRes = await fetch(`${addr}/v1/auth/approle/login`, {
      method: 'POST',
      body: JSON.stringify({ role_id: roleId, secret_id: secretId }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!loginRes.ok) {
      const error = await loginRes.text();
      throw new Error(`Failed to login to OpenBao: ${loginRes.statusText} - ${error}`);
    }

    const loginData = (await loginRes.json()) as {
      auth: { client_token: string };
    };
    const clientToken = loginData.auth.client_token;

    console.log('🔐 OpenBao: Fetching secrets from', path);

    // 2. Fetch secrets
    const secretRes = await fetch(`${addr}/v1/${path}`, {
      headers: {
        'X-Bao-Token': clientToken,
        'X-Vault-Token': clientToken,
      },
    });

    if (!secretRes.ok) {
      const error = await secretRes.text();
      throw new Error(`Failed to fetch secrets from OpenBao: ${secretRes.statusText} - ${error}`);
    }

    const secretData = (await secretRes.json()) as {
      data: { data: Record<string, string> };
    };
    const secrets = secretData.data.data; // KV v2 format

    // 3. Inject into process.env
    Object.entries(secrets).forEach(([key, value]) => {
      let finalValue = typeof value === 'string' ? value : JSON.stringify(value);

      // Strip surrounding double quotes if present
      if (finalValue.startsWith('"') && finalValue.endsWith('"')) {
        finalValue = finalValue.slice(1, -1);
      }

      // 🐋 Docker Compatibility: Translate localhost to service names if running in Docker
      const isDocker = process.env.BAO_ADDR?.includes('host.docker.internal') || process.env.DOCKER === 'true';
      if (isDocker && typeof finalValue === 'string') {
        // Translate DATABASE_URL: localhost:5435/5436 -> postgresdb:5432
        if (key === 'DATABASE_URL') {
          finalValue = finalValue.replace(/localhost:\d+/, 'postgresdb:5432');
        }
      }

      process.env[key] = finalValue;
    });

    process.env.DATABASE_URL = `postgresql://${process.env.POSTGRES_USER_ENCODED}:${process.env.POSTGRES_PASSWORD}@postgresdb:5432/${process.env.POSTGRES_DB}?schema=public`;

    console.log(`✅ OpenBao: Successfully loaded ${Object.keys(secrets).length} secrets.`);

    secretsLoaded = true;
  } catch (error) {
    console.error('❌ OpenBao Error:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error; // Fail fast in production
    }
  }
}
