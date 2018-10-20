var request = require('request-promise');
var parser = require('./parser');


var deqUrl = 'http://air.utah.gov/csvFeed.php?id=forecast';

module.exports = function (county) {
  return new Promise((resolve, reject) => {
    request(deqUrl, (error, response, body) => {
      if (error || !response || response.statusCode !== 200) {
          reject(Error('There is an error with the DEQ website service. Please try again later'));
      } else {

        try {
          var data = parser(body, new Date(), county);

          resolve({
            color: data.color,
            county
          });
        } catch (error) {
          console.log(error.message);
          reject({ error });
        }
      }
    });
  });
};
