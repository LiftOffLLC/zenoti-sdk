module.exports = {
  baseURL: process.env.ZENOTI_BASE_URL || 'https://api.zenoti.com',
  authStrategy: process.env.ZENOTI_AUTH_STRATEGY,
  apikey: process.env.ZENOTI_API_KEY,
  clientid: process.env.ZENOTI_CLIENTID,
  username: process.env.ZENOTI_USERNAME,
  password: process.env.ZENOTI_PASSWORD,
  redisURL: process.env.REDIS_URL,
};
