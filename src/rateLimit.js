const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function rateLimit(rateInMs = 0) {
  const throttle = () => {
    const deferred = {};
    const promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    }).then();
    throttle.queue.push(deferred);

    return throttle.check().then(() => promise);
  };

  throttle.currentlyActiveCheck = null;
  throttle.lastExecutionTime = 0;
  throttle.queue = [];

  throttle.resolveUniform = (fnName, v) => {
    throttle.queue.forEach(deferred => deferred[fnName](v));
    throttle.queue = [];
  };

  throttle.resolveAll = v => throttle.resolveUniform('resolve', v);
  throttle.rejectAll = v => throttle.resolveUniform('reject', v);

  throttle.check = () => {
    if (throttle.currentlyActiveCheck || throttle.queue.length === 0) {
      return throttle.currentlyActiveCheck;
    }

    const waitingTime = rateInMs - (Date.now() - throttle.lastExecutionTime);
    throttle.currentlyActiveCheck =
      (waitingTime > 0 ? delay(waitingTime) : Promise.resolve()).then(() => {
        const now = Date.now();
        if (now - throttle.lastExecutionTime >= rateInMs) {
          throttle.lastExecutionTime = now;
          throttle.queue.shift().resolve();
        }

        throttle.currentlyActiveCheck = null;
        throttle.check();
      });
    return throttle.currentlyActiveCheck;
  };

  return throttle;
}

export const limitFetch = rateLimit(300);


const current = [];
const backlog = [];
const limit = parseInt(process.env.RATE_LIMIT || '5', 10);
export const concurrent = (fn, ...args) => {
  const enqueue = ([promise, resolve, fn2, ...args2]) => {
    current.push(promise);
    resolve(fn2(...args2));
    promise.then(
      res => {
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
  const promise = new Promise(res => {
    resolve = res;
  });

  if (current.length < limit) {
    enqueue([promise, resolve, fn, ...args]);
  } else {
    backlog.push([promise, resolve, fn, ...args]);
  }

  return promise;
};
