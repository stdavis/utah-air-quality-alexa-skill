import got from 'got';
import parser from './parser.js';

const deqUrl = 'https://air.utah.gov/csvFeed.php?id=forecast';

export default async function (county) {
  try {
    const response = await got(deqUrl, {
      https: {
        rejectUnauthorized: false,
      },
    });

    if (!response || response.statusCode !== 200) {
      throw Error(`There is an error with the DEQ website service. Please try again later. ${response}`);
    }

    const data = parser(response.body, new Date(), county);

    return {
      color: data.color,
      county,
    };
  } catch (error) {
    console.log(error.message);

    throw error;
  }
}
