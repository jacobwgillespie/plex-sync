// @flow

import { parseString } from 'xml2js';
import fetch from 'isomorphic-fetch';

export const parseXML = (xml: string) => new Promise((resolve, reject) => {
  parseString(xml, (err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
});

export const fetchText = (url: string, ...opts: Array<any>) =>
  fetch(url, ...opts)
  .then(res => res.text());

export const fetchXML = (url: string, ...opts: Array<any>) =>
  fetchText(url, ...opts)
  .then(res => parseXML(res));

export const wait = (milliseconds: number) => new Promise((resolve) => {
  setTimeout(() => resolve(), milliseconds);
});
