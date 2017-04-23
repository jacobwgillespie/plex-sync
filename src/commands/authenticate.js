import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

import {
  checkPin,
  getUser,
  requestPin,
} from '../plex/api';
import { getConfigV1, setConfigV1 } from '../config';
import { wait } from '../plex/utils';

const waitAndCheckPin = async (pin) => {
  await wait(1000);
  return checkPin(pin.id);
};

export default async () => {
  const authAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'authStrategy',
      message: 'How would you like to authenticate with Plex?',
      choices: [
        { name: 'Login with a PIN on Plex.tv (easiest and recommended)', value: 'pin' },
        { name: 'Enter a Plex authentication token (harder)', value: 'token' },
      ],
    },
    {
      type: 'input',
      name: 'authToken',
      message: 'What is your Plex authentication token?',
      when: obj => obj.authStrategy === 'token',
    },
  ]);

  let token = authAnswers.authToken;

  if (authAnswers.authStrategy === 'pin') {
    const pin = await requestPin();
    console.log(`Please visit ${chalk.underline('https://plex.tv/pin')} and enter the PIN ${chalk.bold(pin.code)}`);
    const spinner = ora('Waiting for Plex authentication').start();
    spinner.color = 'yellow';
    let status = {};

    while (!status.authToken) {
      status = await waitAndCheckPin(pin); // eslint-disable-line no-await-in-loop
      // console.log(JSON.stringify(status, null, 2));
      if (status.authToken) {
        spinner.succeed('Successfully authenticated');
        token = status.authToken;
      }
    }
  }

  // console.log(token);
  const user = await getUser(token);

  const config = getConfigV1();

  config.users = config.users.filter(u => u.uuid !== user.uuid);
  config.users.push(user);
  setConfigV1(config);

  console.log(`Authenticated as ${user.title}`);
};
