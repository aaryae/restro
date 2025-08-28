// REDIS EXCLUSION
// const redis = require("../../configs/redis");
const Redlock = require("redlock");
const { LOCK_TTL } = require("../../constants/time-constant");

const lockClient = new Redlock([redis], {
  retryCount: 10,
  retryDelay: 200,
  retryJitter: 200,
});
const withLock = async (lockKey, fn) => {
  console.log(`Acquiring lock for ${lockKey}`);
  let lock;
  try {
    lock = await lockClient.acquire([lockKey], LOCK_TTL);
    console.log("Lock acquired:", lock);
    return await fn();
  } catch (e) {
    throw e;
  } finally {
    if (lock) {
      console.log(`Releasing lock for ${lockKey}`);
      await lockClient
        .unlock(lock)
        .catch((err) => console.error("Lock release error:", err));
    }
  }
};

module.exports = { withLock, lockClient };
