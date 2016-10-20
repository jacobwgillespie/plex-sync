/* eslint-disable no-console */

import ProgressBar from 'ascii-progress';

export const log = (...args) => console.error(...args);

export const TOKEN = process.env.PLEX_TOKEN;

export const exitUsage = () => {
  console.error(`
Usage: plex-sync [token@]IP[:PORT]/SECTION[,rw] [token@]IP[:PORT]/SECTION[,rw] [[token@]IP[:PORT]/SECTION[,rw]...]

Example:

    Sync section 1 on a server with the default port with section 2 on another server:
    $ plex-sync 10.0.1.2/1 10.0.1.3:32401/2

    Sync three servers:
    $ plex-sync 10.0.1.2/1 10.0.1.3/1 10.0.1.4/1

    Dry run, to see what the script will do:
    $ DRY_RUN=1 plex-sync 10.0.1.5/1 10.0.1.5/1

    Precise matching (slow and may crash the Plex server):
    $ MATCH_TYPE=precise plex-sync 10.0.1.5/1 10.0.1.5/1

    Syncing between multiple Plex users (different access tokens):
    $ plex-sync xxxxxx@10.0.1.5/1 zzzzzz@10.0.1.10/3

    Unidirectional sync (read from one server, write to the other):
    $ plex-sync 10.0.1.5/1,r 10.0.1.10/3,w

    Complex use case:
    $ plex-sync xxxx@10.0.1.5:32401/1,r yyyy@10.0.1.10/3,w zzzz@10.0.1.15/2,rw
`.trim());
  process.exit(1);
};

export const exitToken = () => {
  console.error(`
Error: missing Plex authentication token for one or more of the specified servers

Please either set your Plex authentication token via the PLEX_TOKEN environment variable
or pass the Plex token in the server definition (TOKEN@0.0.0.0...).  See 'plex-sync help'
for more information.

If you need help locating your Plex authentication token, feel free to use the bookmarklet
located at https://jacobwgillespie.github.io/plex-token-bookmarklet/
`.trim());
  process.exit(1);
};

export const progressMap = (items, fn) => {
  const progress = new ProgressBar({ total: items.length });

  return Promise.all(items.map((...args) => {
    progress.tick();
    return fn(...args);
  }));
};

export const parseCLIArg = (arg) => {
  const matches = arg.match(/^(([^@]+)@)?(([^:]+)(:\d+)?)\/(\d+)(,[rw][rw]?)?$/);
  if (!matches) exitUsage();
  const token = matches[2] || TOKEN;
  const host = `${matches[4]}${matches[5] || ':32400'}`;
  const section = matches[6] || '1';
  const modeString = matches[8] || 'rw';
  const mode = {
    read: modeString.includes('r'),
    write: modeString.includes('w'),
  };

  if (!token) exitToken();

  return { token, host, section, mode };
};
