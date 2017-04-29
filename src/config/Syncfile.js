// @flow

import fs from 'fs';
import yaml from 'js-yaml';

export default class Syncfile {
  data: Object;

  static fromFile(filename) {
    const fileContents = fs.readFileSync(filename, 'utf8');
    return new Syncfile(yaml.safeLoad(fileContents));
  }

  constructor(data: Object) {
    this.data = data;
  }
}
