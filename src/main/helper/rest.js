const _ = require('lodash');
const axios = require('axios');
const QueryString = require('querystring');
const Logger = require('./logger');
const Helper = require('./utilities');
const RedisClient = require('./redisclient');
const defaultConfig = require('../config');

class Rest {
  constructor(config) {
    this.setup(_.merge(config, defaultConfig));
  }

  /**
   * @constructor
   * @memberof module:Auth
   * @param {object} config
   * @param {string} config.authStrategy zenoti authStrategy API_KEY || PASSWORD
   * @param {string} [config.apikey] zenoti apikey
   * @param {string} [config.username] zenoti username
   * @param {string} [config.password] zenoti password
   * @param {string} [config.clientid] zenoti clientid
   * @param {string} [config.baseURL] different host for authentication
   * @param {string} [config.redisURL] redis url to cache accesstoken
   */
  setup(config) {
    if (!config.authStrategy || config.authStrategy.length === 0) {
      throw new Error('Must provide a authStrategy');
    }

    if (config.authStrategy === 'API_KEY') {
      if (!config.apikey || config.apikey.length === 0) {
        throw new Error('Must provide an api key');
      }
      this.apikey = config.apikey;
    } else if (config.authStrategy === 'PASSWORD') {
      if (!config.clientid || config.clientid.length === 0) {
        throw new Error('Must provide a clientid');
      }
      this.clientid = config.clientid;
      if (!config.username || config.username.length === 0) {
        throw new Error('Must provide a username');
      }
      this.username = config.username;
      if (!config.password || config.password.length === 0) {
        throw new Error('Must provide password');
      }
      this.password = config.password;
      if (!config.redisURL || config.redisURL.length === 0) {
        throw new Error('Must provide redisURL');
      }
      this.redisURL = config.redisURL;
      this.rClient = new RedisClient(this.redisURL);
      this.access_token = null;
    } else {
      throw new Error('unknown authStrategy, must be API_KEY or PASSWORD');
    }
    this.authStrategy = config.authStrategy;
    this.baseURL = config.baseURL;
    this.restOptions = {
      baseURL: config.baseURL,
      headers: {
        Accept: 'application/json; charset=UTF-8',
        'Content-Type': 'application/json',
      },
    };

    this.client = axios.create(this.restOptions);
  }

  /**
   * @memberof module:Rest
   */
  async getToken() {
    const body = {
      username: this.username,
      password: this.password,
      grant_type: 'password',
      clientid: this.clientid,
    };
    try {
      const authClient = axios.create({
        baseURL: this.baseURL,
        headers: {
          Accept: 'application/json; charset=UTF-8',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const response = await authClient.request({
        url: '/Token',
        method: 'post',
        params: {},
        data: QueryString.stringify(body),
      });

      const request = {
        url: '/Token',
        data: Helper.maskSensitives(body),
      };

      Logger.info('Auth Rest.post:', { request, response: response.data });

      return { isSuccess: true, data: response.data };
    } catch (error) {
      const request = {
        url: '/Token',
        data: Helper.maskSensitives(body),
      };

      Logger.error('Auth Rest.post:', {
        request,
        response: error.message,
      });

      return { isSuccess: false, error };
    }
  }

  /**
   * @param {Boolean} isGenerateNew
   */
  async getAccessToken(isGenerateNew = false) {
    let token = null;
    if (!isGenerateNew) {
      token = await this.rClient.getAccessToken();
    }
    if (token) {
      return token;
    }

    const { isSuccess, data, error } = await this.getToken();
    if (!isSuccess) {
      throw new Error(
        `Unable to generate auth token status code: ${
          error.response.status
        } data: ${JSON.stringify(error.response.data)} `,
      );
    }

    await this.rClient.saveAccessToken(data.access_token, data.expires_in - 1);
    await this.rClient.saveRefreshToken(data.refresh_token);
    return data.access_token;
  }

  /**
   * @name get Make GET request and response isSuccess as true with data upon successful call, otherwise false and error object.
   * @param {string} url
   * @param {object} params
   */
  async get(url, params = {}) {
    return this.request('get', url, params);
  }

  /**
   * @name post Make POST request and response isSuccess as true with data upon successful call, otherwise false and error object.
   * @param {string} url
   * @param {object} queryParams
   * @param {object} body
   */
  async post(url, queryParams, body) {
    return this.request('post', url, queryParams, body);
  }

  /**
   * @name put Make PUT request and response isSuccess as true with data upon successful call, otherwise false and error object.
   * @param {string} url
   * @param {object} queryParams
   * @param {object} body
   */
  async put(url, queryParams, body) {
    return this.request('put', url, queryParams, body);
  }

  /**
   * @name delete Make DELETE request and response isSuccess as true with data upon successful call, otherwise false and error object.
   * @param {string} url
   * @param {object} queryParams
   * @param {object} body
   */
  async delete(url, queryParams, body) {
    return this.request('delete', url, queryParams, body);
  }

  /**
   * @name handleError Handles the request method error retries the same request with new access_token if retry is true
   * @param {object} error
   * @param {object} config
   * @param {Boolean} retry
   */
  async handleError(error, config, retry) {
    const request = {
      url: config.url,
      params:
        typeof params !== 'string'
          ? Helper.maskSensitives(config.params)
          : config.params,
      data:
        typeof data !== 'string'
          ? Helper.maskSensitives(config.data)
          : config.data,
    };

    Logger.error(`rest.${config.method}.error:`, {
      request,
      response:
        typeof error.response.data !== 'undefined'
          ? error.response.data
          : error,
    });

    if (
      retry &&
      this.authStrategy !== 'API_KEY' &&
      error.response &&
      error.response.status === 401
    ) {
      this.access_token = null;
      await this.getAccessToken(true);
      return this.request(
        config.method,
        config.url,
        config.params,
        config.data,
        false,
      );
    }

    return { isSuccess: false, error };
  }

  /**
   * @name request Makes http request and return response upon successful call, otherwise false would be returned.
   * @param {string} method - http verbs are considered valid. make sure to pass in lower case.
   * @param {string} url
   * @param {object} params - the params to use in query string with request
   * @param {object} data - the data to use in POST, PUT and DELETE
   */
  async request(method, url, params = {}, data = {}, retry = true) {
    const { client } = this;
    const config = {
      url,
      method,
      params,
    };

    if (_.indexOf(['post', 'put'], method) !== -1) {
      config.data = data;
    }

    if (this.authStrategy === 'API_KEY') {
      config.headers = { Authorization: `apikey ${this.apikey}` };
    }

    if (this.authStrategy === 'PASSWORD' && this.access_token) {
      config.headers = { Authorization: this.access_token };
    }

    if (this.authStrategy === 'PASSWORD' && !this.access_token) {
      const token = await this.getAccessToken();
      this.access_token = 'bearer '.concat(token);
      config.headers = { Authorization: this.access_token };
    }

    try {
      const response = await client.request(config);
      const request = {
        url,
        params:
          typeof params !== 'string' ? Helper.maskSensitives(params) : params,
        data: typeof data !== 'string' ? Helper.maskSensitives(data) : data,
      };
      /**
       * Log the request info and mask only non string payloads .
       */
      Logger.info(`rest.${method}:`, {
        request,
        response: response.data,
      });

      return { isSuccess: true, data: response.data };
    } catch (error) {
      return await this.handleError(error, config, retry);
    }
  }
}

module.exports = Rest;
