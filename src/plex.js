import { parseString } from 'xml2js';
import fetch from 'isomorphic-fetch';

import { concurrent } from './rateLimit';
import { progressMap } from './ui';

import './env';

const PAGE_SIZE = 32;

const parseXML = xml => new Promise((resolve, reject) => {
  parseString(xml, (err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
});

const fetchText = url =>
  fetch(url)
  .then(res => res.text());

const fetchXML = url =>
  fetchText(url)
  .then(res => parseXML(res));

const rateLimitFetchXML = url =>
  concurrent(fetchXML, url);

const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

const fetchMediaContainer = async (server, page = 1) => {
  const start = (page - 1) * PAGE_SIZE;
  const url = `${server.protocol}://${server.host}/library/sections/${server.section}/allLeaves?X-Plex-Token=${server.token}&X-Plex-Container-Start=${start}&X-Plex-Container-Size=${PAGE_SIZE}`;
  return (await rateLimitFetchXML(url));
};

export const fetchMedia = async (server) => {
  // Determine total collection size
  const totalSize = parseInt((
    await fetchMediaContainer(server)
  ).MediaContainer.$.totalSize, 10);
  const totalPages = Math.ceil(totalSize / PAGE_SIZE);

  // Fetch all videos
  const promises = [];
  for (let i = 1; i <= totalPages; i += 1) {
    promises.push(fetchMediaContainer(server, i));
  }

  // Unpack video results
  const videos = [];
  await Promise.all(promises).then(
    (results) => {
      results.forEach(
        (res) => {
          res.MediaContainer.Video.forEach(
            (video) => {
              videos.push(video);
            }
          );
        }
      );
    }
  );

  // Map videos into entries
  return videos
  .map(
    media => media.$
  )
  .map(({
    grandparentTitle = '',
    index = '',
    key,
    parentIndex = '',
    title,
    viewCount,
    year,
  }) => ({
    guid: `${grandparentTitle} - ${parentIndex} - ${index} - ${year} - ${title}`,
    key,
    title,
    watched: parseInt(viewCount || '0', 10) > 0,
    year,
  }));
};

export const fetchMediaGUID = async (server, media) => {
  const url = `${server.protocol}://${server.host}${media.key}?X-Plex-Token=${server.token}`;
  return await rateLimitFetchXML(url)
  .then(res => res.MediaContainer.Video[0].$)
  .then(({ guid }) => ({
    ...media,
    guid,
  }));
};

export const fetchMovies = async (server, fuzzy = true) => {
  const media = await fetchMedia(server);
  return fuzzy ? media : await progressMap(
    media,
    movie => fetchMediaGUID(server, movie)
  );
};

const extractID = key => key.match(/\/library\/metadata\/(\d+)/)[1];

export const markWatched = async (server, movie) => await fetchText(
  `${server.protocol}://${server.host}/:/scrobble?identifier=com.plexapp.plugins.library&key=${extractID(movie.key)}&X-Plex-Token=${server.token}`
);

export const markUnatched = async (server, movie) => await fetchText(
  `${server.protocol}://${server.host}/:/unscrobble?identifier=com.plexapp.plugins.library&key=${extractID(movie.key)}&X-Plex-Token=${server.token}`
);
