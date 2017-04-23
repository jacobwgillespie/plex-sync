import { parseString } from 'xml2js';
import fetch from 'isomorphic-fetch';

export const parseXML = xml => new Promise((resolve, reject) => {
  parseString(xml, (err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
});

export const fetchText = (url, ...opts) =>
  fetch(url, ...opts)
  .then(res => res.text());

export const fetchXML = (url, ...opts) =>
  fetchText(url, ...opts)
  .then(res => parseXML(res));

export const wait = milliseconds => new Promise((resolve) => {
  setTimeout(() => resolve(), milliseconds);
});
