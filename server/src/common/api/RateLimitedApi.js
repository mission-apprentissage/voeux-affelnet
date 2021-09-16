const axios = require("axios");
const logger = require("../logger");
const RateLimiter = require("./RateLimiter");

class RateLimitedApi {
  constructor(name, baseURL, options = {}) {
    this.name = name;
    this.rateLimiter = new RateLimiter(this.name, {
      nbRequests: 5,
      durationInSeconds: 1,
      client: options.axios || axios.create({ baseURL, timeout: 10000 }),
    });

    this.rateLimiter.on("status", ({ queueSize, maxQueueSize }) => {
      if (queueSize / maxQueueSize >= 0.8) {
        logger.warn(`${this.name} api queue is almost full : ${queueSize} / ${maxQueueSize}`);
      }
    });
  }

  execute(callback) {
    return this.rateLimiter.execute(callback);
  }
}

module.exports = RateLimitedApi;
