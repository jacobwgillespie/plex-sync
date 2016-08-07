import { parseString } from 'xml2js';
import realfetch from 'isomorphic-fetch';

import { concurrent } from './rateLimit';

import './env';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetch = (...args) => {
  console.log(...args);
  return delay(50).then(() => realfetch(...args));
};

const parseXML = xml => new Promise((resolve, reject) => {
  parseString(xml, (err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
});

export const TOKEN = process.env.PLEX_TOKEN;

const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

const collectVideos = async (src, mediaContainer) => {
  if (mediaContainer.Video) return mediaContainer.Video;
  if (!mediaContainer.Directory) return [];

  const urls = mediaContainer.Directory.map(
    directory => `http://${src}${directory.$.key}?X-Plex-Token=${TOKEN}`
  );

  return flatten(await Promise.all(urls.map(
    async url => (
      await concurrent(fetch, url)
      .then(res => res.text())
      .then(res => parseXML(res))
      .then(res => res.MediaContainer)
      .then(res => collectVideos(src, res))
    )
  )));
};

export const fetchURLs = async (src, section = 1) => {
  const allURL = `http://${src}/library/sections/${section}/all?X-Plex-Token=${TOKEN}`;
  const data = (
    await concurrent(fetch, allURL)
    .then(res => res.text())
    .then(res => parseXML(res))
    .then(res => res.MediaContainer)
    .then(res => collectVideos(src, res))
  );

  // console.log('data', data);

  return data
  .map(
    media => `http://${src}${media.$.key}?X-Plex-Token=${TOKEN}`
  );
};

export const fetchMediaInfo = async src => await concurrent(fetch, src)
  .then(res => res.text())
  .then(res => parseXML(res))
  .then(res => res.MediaContainer.Video[0].$)
  .then(({ guid, key, title, viewCount }) => ({
    guid,
    key,
    title,
    viewCount: parseInt(viewCount || '0', 10),
  }));

export const markWatched = async (src, key) => {
  const id = key.match(/\/library\/metadata\/(\d+)/)[1];
  const url = `http://${src}/:/scrobble?identifier=com.plexapp.plugins.library&key=${id}&X-Plex-Token=${TOKEN}`;
  return await concurrent(fetch, url).then(res => res.text());
};

export const markUnatched = async (src, key) => {
  const id = key.match(/\/library\/metadata\/(\d+)/)[1];
  const url = `http://${src}/:/unscrobble?identifier=com.plexapp.plugins.library&key=${id}&X-Plex-Token=${TOKEN}`;
  return await concurrent(fetch, url).then(res => res.text());
};
