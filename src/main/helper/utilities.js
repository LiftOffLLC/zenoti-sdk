const Moment = require('moment');
const _ = require('lodash');

/**
 * Sensitive keys to hide it from log.
 */
const sensitiveKeys = ['password'];

module.exports = {
  formatDateTime: (value, format = 'YYYY-MM-DD hh:mm:ss') =>
    Moment(value).format(format),

  /**
   * Mask sensitive data.
   */
  maskSensitives: data => {
    const filtered = {};

    _.filter(data, (v, k) => {
      if (_.indexOf(sensitiveKeys, k) === -1) {
        filtered[k] = v;
      } else {
        filtered[k] = '*****';
      }
    });

    return filtered;
  },
};
