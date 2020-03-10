module.exports = {
  baseURL: process.env.ZENOTI_BASE_URL || 'https://api.zenoti.com',
  authStrategy: process.env.ZENOTI_AUTH_STRATEGY,
  clientid: process.env.ZENOTI_CLIENTID,
  apikey: process.env.ZENOTI_API_KEY,
  username: process.env.ZENOTI_USERNAME,
  password: process.env.ZENOTI_PASSWORD,
  redisURL: process.env.REDIS_URL,
};
