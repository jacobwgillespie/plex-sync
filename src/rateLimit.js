const current = [];
const backlog = [];
export const limit = parseInt(process.env.RATE_LIMIT || '5', 10);
export const concurrent = (fn, ...args) => {
  const enqueue = ([promise, resolve, fn2, ...args2]) => {
    current.push(promise);
    resolve(fn2(...args2));
    promise.then(
      (res) => {
        current.splice(current.indexOf(promise), 1);

        if (current.length < limit && backlog.length > 0) {
          enqueue(backlog.pop());
        }
        return res;
      }
    );
    return promise;
  };

  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });

  if (current.length < limit) {
    enqueue([promise, resolve, fn, ...args]);
  } else {
    backlog.push([promise, resolve, fn, ...args]);
  }

  return promise;
};
