import ProgressBar from 'ascii-progress';
import updateNotifier from 'update-notifier';

import { exitUsage, log } from './ui';
import { fetchMediaInfo, fetchURLs, markWatched } from './plex';
import pkg from '../package.json';

import './env';

updateNotifier({ pkg }).notify();

const DRY_RUN = !!process.env.DRY_RUN;

const fetchMedia = async (src, section = 1) => {
  const urls = await fetchURLs(src, section);
  const progress = new ProgressBar({
    total: urls.length,
  });
  const media = await Promise.all(urls.map(
    url => fetchMediaInfo(url).then(res => {
      progress.tick();
      return res;
    })
  ));

  return {
    all: media,
    watched: media.filter(m => m.viewCount > 0),
    unwatched: media.filter(m => m.viewCount <= 0),
  };
};

(async () => {
  try {
    if (process.argv.length < 4) {
      exitUsage();
    }

    const servers = process.argv.slice(2).map(src => {
      const matches = src.match(/^(([^:]+)(:\d+)?)\/(\d+)$/);
      if (!matches) exitUsage();
      const host = `${matches[2]}${matches[3] || ':32400'}`;
      const section = matches[4] || '1';
      return { host, section };
    });

    const watched = new Set();
    const unwatched = new Set();

    log(`Reading data from ${servers.map(server => server.host).join(', ')}`);

    const sourceData = await Promise.all(servers.map(
      src => fetchMedia(src.host, src.section)
    ));

    for (const srcMedia of sourceData) {
      srcMedia.watched.forEach(media => {
        watched.add(media.guid);
      });
      srcMedia.unwatched.forEach(media => {
        unwatched.add(media.guid);
      });
    }

    log('Syncing any unsynced media');

    for (const [idx, srcMedia] of sourceData.entries()) {
      const src = servers[idx];
      const requiresMarking = srcMedia.unwatched.filter(m => watched.has(m.guid));

      const progress = new ProgressBar({
        total: requiresMarking.length,
      });

      for (const media of requiresMarking) {
        if (!DRY_RUN) {
          await markWatched(src.host, media.key);
          progress.tick();
        } else {
          log(`Dry run: marking ${media.title} watched on ${src}`);
        }
      }
    }

    log('Sync completed!');
  } catch (e) {
    log(e.stack);
  }
})();
