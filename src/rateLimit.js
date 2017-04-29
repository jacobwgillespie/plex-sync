// @flow

type RateLimitObject = {
  promise: Promise<any>,
  resolve: (result: any) => void,
  fn: (...any) => any,
  args: Array<any>,
};

const current = [];
const backlog: Array<RateLimitObject> = [];
export const limit = parseInt(process.env.RATE_LIMIT || '5', 10);
export const concurrent = (fn: (...any) => any, ...args: Array<any>) => {
  const enqueue = ({ promise, resolve, fn: fn2, args: args2 }: RateLimitObject) => {
    current.push(promise);
    resolve(fn2(...args2));
    promise.then(
      (res: any): any => {
        current.splice(current.indexOf(promise), 1);

        if (current.length < limit && backlog.length > 0) {
          enqueue(backlog.pop());
        }
        return res;
      },
    );
    return promise;
  };

  let resolve = () => {};
  const promise = new Promise((res) => {
    resolve = res;
  });

  if (current.length < limit) {
    enqueue({ promise, resolve, fn, args });
  } else {
    backlog.push({ promise, resolve, fn, args });
  }

  return promise;
};
