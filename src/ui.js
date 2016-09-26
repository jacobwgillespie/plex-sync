/* eslint-disable no-console */

import ProgressBar from 'ascii-progress';

export const log = (...args) => console.error(...args);

export const exitUsage = () => {
  console.error(`
Usage: plex-sync IP[:PORT]/SECTION IP[:PORT]/SECTION [IP[:PORT]/SECTION...]

Example:

Sync section 1 on a server with the default port with section 2 on another server:
$ plex-sync 10.0.1.2/1 10.0.1.3:32401/2

Sync three servers:
$ plex-sync 10.0.1.2/1 10.0.1.3/1 10.0.1.4/1
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
  const matches = arg.match(/^(([^:]+)(:\d+)?)\/(\d+)$/);
  if (!matches) exitUsage();
  const host = `${matches[2]}${matches[3] || ':32400'}`;
  const section = matches[4] || '1';
  return { host, section };
};
