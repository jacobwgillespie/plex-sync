import { parseString } from 'xml2js';
import fetch from 'isomorphic-fetch';

import './env';

const parseXML = xml => new Promise((resolve, reject) => {
  parseString(xml, (err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
});

export const TOKEN = process.env.PLEX_TOKEN;

export const fetchURLs = async (src, section = 1) => {
  const allURL = `http://${src}/library/sections/${section}/all?X-Plex-Token=${TOKEN}`;
  return (await fetch(allURL)
  .then(
    res => res.text()
  )
  .then(
    res => parseXML(res)
  )
  .then(
    res => res.MediaContainer.Video
  ))
  .map(
    media => `http://${src}${media.$.key}?X-Plex-Token=${TOKEN}`
  );
};

export const fetchMediaInfo = async src => await fetch(src)
  .then(
    res => res.text()
  )
  .then(
    res => parseXML(res)
  )
  .then(
    res => res.MediaContainer.Video[0].$
  )
  .then(
    ({ guid, key, title, viewCount }) => ({
      guid,
      key,
      title,
      viewCount: parseInt(viewCount || '0', 10),
    })
  );

export const markWatched = async (src, key) => {
  const id = key.match(/\/library\/metadata\/(\d+)/)[1];
  const url = `http://${src}/:/scrobble?identifier=com.plexapp.plugins.library&key=${id}&X-Plex-Token=${TOKEN}`;
  return await fetch(url).then(res => res.text());
};

export const markUnatched = async (src, key) => {
  const id = key.match(/\/library\/metadata\/(\d+)/)[1];
  const url = `http://${src}/:/unscrobble?identifier=com.plexapp.plugins.library&key=${id}&X-Plex-Token=${TOKEN}`;
  return await fetch(url).then(res => res.text());
};
