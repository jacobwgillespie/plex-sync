// @flow

import os from 'os';

import { fetchXML } from './utils';
import pkg from '../../package.json';

export const plexClientHeaders = {
  'X-Plex-Client-Identifier': '21621f37-22fb-4373-8f12-1df14d74e961',
  'X-Plex-Device-Name': os.hostname(),
  'X-Plex-Device': os.platform(),
  'X-Plex-Platform-Version': process.versions.node,
  'X-Plex-Platform': 'Node.js',
  'X-Plex-Product': pkg.name,
  'X-Plex-Provides': 'controller',
  'X-Plex-Version': pkg.version,
};

const isError = data => Boolean(data.errors);

const formatError = data => ({
  code: data.errors.error[0].$.code,
  message: data.errors.error[0].$.message,
});

// const errorOrFalse = data => (isError(data) ? formatError(data) : false);

export const fetch = (url: string, opts: Object) => fetchXML(url, opts).then(
  (data) => {
    if (isError(data)) {
      const formattedError = formatError(data);
      throw new Error(`${formattedError.message} (${formattedError.code})`);
    }

    return data;
  },
);

export const fetchPlexTV = (endpoint: string, opts: Object) => fetch(`https://plex.tv${endpoint}`, opts);

export const getUser = (token: string) =>
  fetchPlexTV('/api/v2/user', {
    headers: {
      ...plexClientHeaders,
      'X-Plex-Token': token,
    },
  }).then(
    data => data.user.$,
  );

// https://plex.tv/api/v2/user?

export const getUsers = (token: string) =>
  fetchPlexTV('/api/users', {
    headers: {
      ...plexClientHeaders,
      'X-Plex-Token': token,
    },
  });


export const requestPin = async () => {
  const data = await fetchPlexTV('/pins.xml', {
    method: 'POST',
    headers: plexClientHeaders,
  });
  const { pin } = data;

  return {
    code: pin.code[0],
    id: pin.id[0]._,
  };
};

export const checkPin = async (id: string) => {
  const data = await fetchPlexTV(`/pins/${id}.xml`, {
    headers: plexClientHeaders,
  });
  const { pin } = data;

  if (!pin) return {};

  return {
    authToken: pin['auth-token'][0]._,
    code: pin.code[0],
    id: pin.id[0]._,
    userID: pin['user-id'][0]._,
  };
};
