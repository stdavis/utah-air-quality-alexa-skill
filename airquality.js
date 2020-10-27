var parser = require('./parser');
const fetch = require('node-fetch');


var deqUrl = 'https://air.utah.gov/csvFeed.php?id=forecast';

module.exports = async function (county) {
  try {
    const response = await fetch(deqUrl, { agent: {
      rejectUnauthorized: false
    }});
    if (!response || response.status !== 200) {
      throw Error(`There is an error with the DEQ website service. Please try again later. ${response}`);
    }
    const text = await response.text();
    var data = parser(text, new Date(), county);

    return {
      color: data.color,
      county
    };

  } catch (error) {
    console.log(error.message);

    throw error;
  }
};
