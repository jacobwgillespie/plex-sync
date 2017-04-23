import { getConfigV1 } from '../config';

export default () => {
  console.log(JSON.stringify(getConfigV1(), null, 2));
};
