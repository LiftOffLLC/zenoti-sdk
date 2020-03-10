/* eslint-disable class-methods-use-this */
const Redis = require('redis');
const Promise = require('bluebird');
const _ = require('lodash');
const Logger = require('./logger');
// const Config = require('../config');

Promise.promisifyAll(Redis.RedisClient.prototype);
Promise.promisifyAll(Redis.Multi.prototype);

class RedisClient {
  constructor(rUrl) {
    this.redisClient = Redis.createClient({
      url: rUrl,
    });
  }

  async flushDB() {
    return await this.redisClient.flushallAsync();
  }

  getKey(key) {
    const keyMap = {
      accessToken: 'ZENOTI::ACCESS::TOKEN',
      refreshToken: 'ZENOTI::REFRESH::TOKEN',
    };
    return keyMap[key];
  }

  async saveAccessToken(token, ttl = 24 * 60 * 60 - 60) {
    const key = this.getKey('accessToken');
    return this.writeToRedis(key, token, ttl);
  }

  async saveRefreshToken(token) {
    const key = this.getKey('refreshToken');
    return this.writeToRedis(key, token);
  }

  async getAccessToken() {
    const key = this.getKey('accessToken');
    const val = await this.redisClient.getAsync(key);
    Logger.info(`redisClient: getAccessToken : ${key}, value : `, val);
    return val;
  }

  async getRefreshToken() {
    const key = this.getKey('refreshToken');
    const val = await this.redisClient.getAsync(key);
    Logger.info(`redisClient: getRefreshToken : ${key}, value : `, val);
    return val;
  }

  async deleteAccessToken() {
    const key = this.getKey('accessToken');
    await this.deleteKeys([key]);
  }

  async deleteRefreshToken() {
    const key = this.getKey('refreshToken');
    await this.deleteKeys([key]);
  }

  async writeToRedis(key, value, ttl) {
    if (!ttl) {
      return await this.redisClient.setAsync(
        key,
        typeof value === 'object' ? JSON.stringify(value) : value,
      );
    }
    return await this.redisClient.setAsync(
      key,
      typeof value === 'object' ? JSON.stringify(value) : value,
      'EX',
      ttl,
    );
  }

  async deleteKeys(keyPatterns = []) {
    if (_.isEmpty(keyPatterns)) {
      return;
    }

    // If sessionId is not present, treat it all delete all user sessions.
    const keysToDelete = [];
    _.each(keyPatterns, async pattern => {
      const keys = await this.redisClient.keysAsync(pattern);
      _.each(keys, key => {
        Logger.info('redisClient: deleteKeys -- key :: ', key);
        keysToDelete.push(key);
      });
    });

    /**
     * Wait for the all the promises to resolve.
     */
    await Promise.all(keysToDelete);

    // Use Multi to delete all keys one-shot
    if (!_.isEmpty(keysToDelete)) {
      const transaction = this.redisClient.multi();
      _.each(keysToDelete, key => transaction.del(key));
      await transaction.execAsync();
    }
  }
}

module.exports = RedisClient;
