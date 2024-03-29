const logger = require("../logger");
const RateLimiter = require("./RateLimiter");
const ApiError = require("./ApiError");

class RateLimitedApi {
  constructor(name, options = {}) {
    this.name = name;
    this.rateLimiter = new RateLimiter(this.name, {
      nbRequests: options.nbRequests || 1,
      durationInSeconds: options.durationInSeconds || 1,
    });

    this.rateLimiter.on("status", ({ queueSize, maxQueueSize }) => {
      if (queueSize / maxQueueSize >= 0.8) {
        logger.warn(`${this.name} api queue is almost full : ${queueSize} / ${maxQueueSize}`);
      }
    });
  }

  async execute(callback) {
    const response = this.rateLimiter.execute(callback).catch((e) => {
      logger.error(e);
      throw new ApiError(this.name, e.message, e.code || e.response?.status, { cause: e });
    });

    return response;
  }
}

module.exports = RateLimitedApi;
