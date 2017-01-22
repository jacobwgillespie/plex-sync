import yaml from 'js-yaml';
import fs from 'fs';

export const TOKEN = process.env.PLEX_TOKEN;

const DEFAULT_CONFIG = {
  rules: [],
};

export const loadConfig = (filename) => {
  try {
    const config = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
    return config;
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
};

export const validateConfig = () => {};

export const oldCLIArgsToConfig = (args) => {
  const rules = args.map((arg) => {
    const matches = arg.match(/^((https?):\/\/)?(([^@]+)@)?(([^:]+)(:(\d+))?)\/(\d+)(,[rw][rw]?)?$/);
    if (!matches) return null;
    const protocol = matches[2] === 'https' ? 'https' : 'http';
    const token = matches[4];
    const host = matches[6];
    const port = parseInt(matches[8] || '32400', 10);
    const section = parseInt(matches[9] || '1', 10);
    const modeString = matches[10] || 'rw';
    const read = modeString.includes('r');
    const write = modeString.includes('w');

    const rule = { host, section };

    if (protocol !== 'http') rule.protocol = protocol;
    if (port !== 32400) rule.port = port;
    if (token) rule.token = token;
    if (!read) rule.read = read;
    if (!write) rule.write = write;

    return rule;
  }).filter(rule => rule);

  return yaml.safeDump({ default: { rules } });
};
