const _ = require("lodash");
const moment = require("moment");
const axios = require("axios");
const QueryString = require("querystring");
const Logger = require("./logger");
const Helper = require("./utilities");
const defaultConfig = require("../config");
const Boom = require("@hapi/boom");

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
   * @param {string} [config.baseURL] different host for authentication
   * @param {string} [config.redisURL] redis url to cache accesstoken
   */
  setup(config) {
    /** check if authStrategy is valid */
    if (!_.includes(["API_KEY", "ACCESS_TOKEN"], config.authStrategy)) {
      // var error = new Error("Unexpected input");
      throw Boom.boomify(new Error("Invalid auth strategy"), {
        statusCode: 400,
      });
    }

    /** check if starategy api key and empty */
    if (config.authStrategy === "API_KEY" && config.apikey.length === 0) {
      throw Boom.boomify(new Error("Must provide an api key"), {
        statusCode: 400,
      });
    } else if (
      config.authStrategy === "ACCESS_TOKEN" &&
      (!config.username || !config.password || !config.clientid)
    ) {
      throw Boom.boomify(
        new Error("Username or password or client is missing"),
        {
          statusCode: 400,
        }
      );
    }

    // set api key
    this.apikey = config.apikey;
    this.authStrategy = config.authStrategy;
    this.clientid = config.clientid;
    this.username = config.username;
    this.password = config.password;
    this.baseURL = config.baseURL;
    this.restOptions = {
      baseURL: config.baseURL,
      timeout: 15000,
      headers: {
        Accept: "application/json; charset=UTF-8",
        "Content-Type": "application/json",
      },
      validateStatus: function (status) {
        return status == 200;
      },
    };

    /** initialize the axios client */
    this.client = axios.create(this.restOptions);
  }

  /**
   * Get authorization header
   * It returns the authorization header based on auth strategy
   * @note Now only api key auth strategy is implemented
   * @returns {object} 
   * {Authorization:'apikey ***'} 
   * or 
   * {
        Authorization: `Bearer ${accessToken}`,
        application_name: "docs_app",
        application_version: "1.0.0",
      }
   */
  async getAuthorizationHeader(forceAuthToken) {
    return { Authorization: `apikey ${this.apikey}` };
  }

  async getToken() {
    if (this.accessTokenExpiresAt && moment.utc() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const { access_token } = await this.client
      .request({
        url: "/Token",
        method: "post",
        params: {},
        data: `username=${this.username}&password=${this.password}&grant_type=password&clientid=${this.clientid}`,
      })
      .then((response) => response.data);

    this.accessToken = access_token;
    this.accessTokenExpiresAt = moment.utc().add(18000, "second"); // For 5 hours
    return this.accessToken;
  }

  /**
   * @name get Make GET request and response isSuccess as true with data upon successful call, otherwise false and error object.
   * @param {string} url
   * @param {object} params
   */
  async get(url, params = {}, forceAuthToken = false) {
    return this.request("get", url, params, {}, forceAuthToken);
  }

  /**
   * @name post Make POST request and response isSuccess as true with data upon successful call, otherwise false and error object.
   * @param {string} url
   * @param {object} queryParams
   * @param {object} body
   */
  async post(url, queryParams, body, forceAuthToken = false) {
    return this.request("post", url, queryParams, body, forceAuthToken);
  }

  /**
   * @name put Make PUT request and response isSuccess as true with data upon successful call, otherwise false and error object.
   * @param {string} url
   * @param {object} queryParams
   * @param {object} body
   */
  async put(url, queryParams, body) {
    return this.request("put", url, queryParams, body);
  }

  /**
   * @name delete Make DELETE request and response isSuccess as true with data upon successful call, otherwise false and error object.
   * @param {string} url
   * @param {object} queryParams
   * @param {object} body
   */
  async delete(url, queryParams, body, forceAuthToken = false) {
    return this.request("delete", url, queryParams, body, forceAuthToken);
  }

  /**
   * @name request Makes http request and return response upon successful call, otherwise false would be returned.
   * @param {string} method - http verbs are considered valid. make sure to pass in lower case.
   * @param {string} url
   * @param {object} params - the params to use in query string with request
   * @param {object} data - the data to use in POST, PUT and DELETE
   */
  async request(method, url, params = {}, data = {}, forceAuthToken = false) {
    const { client } = this;

    /** request config */
    const config = {
      url,
      method,
      params,
      headers: await this.getAuthorizationHeader(forceAuthToken),
    };

    /** add body data if request is POST, PUT, DELETE, PATCH */
    if (_.includes(["post", "put", "delete", "patch"], method)) {
      config.data = data;
    }

    Logger.info(`@liftoffllc/zenoti - request`, {
      url,
      params,
      data,
    });

    try {
      Logger.info('Making Api Call with config', config);
      const response = await client.request(config);

      /** zenoti can send error though its status 200 */
      if (response.data.Error) {
        throw Boom.boomify(new Error(response.data.Error.Message), {
          statusCode: response.data.Error.StatusCode,
        });
      }

      if (response.data.error) {
        throw Boom.boomify(new Error(response.data.error.message), {
          statusCode: response.data.error.code,
        });
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw Boom.boomify(
          new Error(error.response.data.Message || error.response.data.message),
          {
            statusCode: error.response.data.code || error.response.status,
          }
        );
      }

      throw error;
    }
  }
}

module.exports = Rest;
