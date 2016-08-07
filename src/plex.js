import { parseString } from 'xml2js';
import fetch from 'isomorphic-fetch';

import { concurrent } from './rateLimit';
import { progressMap } from './ui';

import './env';

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

export const TOKEN = process.env.PLEX_TOKEN;

const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

export const fetchMedia = async (server) => {
  const url = `http://${server.host}/library/sections/${server.section}/allLeaves?X-Plex-Token=${TOKEN}`;
  return (
    await fetchXML(url)
    .then(res => res.MediaContainer.Video)
  )
  .map(
    media => media.$
  )
  .map(({ key, title, viewCount, year }) => ({
    guid: `${year} - ${title}`,
    key,
    title,
    watched: parseInt(viewCount || '0', 10) > 0,
    year,
  }));
};

export const fetchMediaGUID = async (server, media) => {
  const url = `http://${server.host}${media.key}?X-Plex-Token=${TOKEN}`;
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

export const markWatched = async (src, key) => {
  const id = key.match(/\/library\/metadata\/(\d+)/)[1];
  const url = `http://${src}/:/scrobble?identifier=com.plexapp.plugins.library&key=${id}&X-Plex-Token=${TOKEN}`;
  return await fetchText(url);
};

export const markUnatched = async (src, key) => {
  const id = key.match(/\/library\/metadata\/(\d+)/)[1];
  const url = `http://${src}/:/unscrobble?identifier=com.plexapp.plugins.library&key=${id}&X-Plex-Token=${TOKEN}`;
  return await fetchText(url);
};
