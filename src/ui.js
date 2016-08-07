/* eslint-disable no-console */

export const log = (...args) => console.error(...args);

export const exitUsage = () => {
  console.error(`
Usage: plex-sync-watched IP[:PORT]/SECTION IP[:PORT]/SECTION [IP[:PORT]/SECTION...]

Example:

Sync section 1 on a server with the default port with section 2 on another server:
$ plex-sync-watched 10.0.1.2/1 10.0.1.3:32401/2

Sync three servers:
$ plex-sync-watched 10.0.1.2/1 10.0.1.3/1 10.0.1.4/1
`.trim());
  process.exit(1);
};
