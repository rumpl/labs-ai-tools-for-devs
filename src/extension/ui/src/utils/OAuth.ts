import { v1 } from '@docker/extension-api-client-types';
import { OAuthClient } from '../types/oauth/Client';

export const listOAuthApps = async (client: v1.DockerDesktopClient) => {
  const output = await client.extension.host?.cli.exec('host-binary', [
    'list-oauth-apps',
  ]);
  return JSON.parse(output?.stdout || '[]') as OAuthClient[];
};

export const authorizeOAuthApp = async (
  client: v1.DockerDesktopClient,
  appId: string,
) => {
  const output = await client.extension.host?.cli.exec('host-binary', [
    'authorize',
    '--name',
    appId,
  ]);
  return output?.stdout;
};

export const unauthorizeOAuthApp = async (
  client: v1.DockerDesktopClient,
  appId: string,
) => {
  const output = await client.extension.host?.cli.exec('host-binary', [
    'unauthorize',
    '--name',
    appId,
  ]);
  return output?.stdout;
};

export const derive = async (
  client: v1.DockerDesktopClient,
  source: string,
  destination: string,
) => {
  const output = await client.extension.host?.cli.exec('host-binary', [
    'derive',
    '-s',
    source,
    '-d',
    destination,
  ]);
  return output?.stdout;
};
