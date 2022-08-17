import got from 'got';
import capitalize from 'lodash.capitalize';

const baseUrl = 'https://api.mapserv.utah.gov/api/v1/search/';
const zipUrl = `${baseUrl}boundaries.zip_code_areas/zip5,shape@envelope`;
const countyUrl = `${baseUrl}boundaries.county_boundaries/name`;
const headers = {
  Referer: 'https://utah-air-quality-alexa-skill.com',
};

export default async function (handlerInput) {
  console.log('getcounty');

  const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
  const consentToken =
    requestEnvelope.context.System.user.permissions && requestEnvelope.context.System.user.permissions.consentToken;
  if (!consentToken) {
    return responseBuilder
      .speak('Please enable Location permissions in the Amazon Alexa app.')
      .withAskForPermissionsConsentCard(['read::alexa:device:all:address:country_and_postal_code'])
      .getResponse();
  }

  try {
    const { deviceId } = requestEnvelope.context.System.device;
    const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
    const address = await deviceAddressServiceClient.getCountryAndPostalCode(deviceId);

    console.log('Address successfully retrieved, now responding to user.');

    if (address.postalCode === null) {
      return responseBuilder
        .speak(`It looks like you don't have zip code set. You can set your zip code from the companion Alexa app.`)
        .getResponse();
    }

    const zipCode = address.postalCode.slice(0, 5);
    console.log(`zipCode: ${zipCode}`);

    const queryString = {
      predicate: `zip5 = '${zipCode}'`,
      apiKey: process.env.MAPSERV_API_KEY,
    };
    const zipResponse = await got(`${zipUrl}?${new URLSearchParams(queryString)}`, { headers }).json();

    console.log(`zip search response: ${JSON.stringify(zipResponse)}`);
    if (zipResponse.result.length === 0) {
      return responseBuilder.speak(`Zip code, ${zipCode} was not found in Utah!`).getResponse();
    }

    // get centroid
    const geometry = zipResponse.result[0].geometry;
    let maxX, maxY, minX, minY;
    geometry.rings[0].forEach((coords) => {
      const [x, y] = coords;
      if (!maxX) {
        maxX = x;
        minX = x;
        maxY = y;
        minY = y;
      } else {
        if (x > maxX) {
          maxX = x;
        } else if (x < minX) {
          minX = x;
        }

        if (y > maxY) {
          maxY = y;
        } else if (y < minY) {
          minY = y;
        }
      }
    });

    const centroidX = Math.round((maxX - minX) / 2 + minX);
    const centroidY = Math.round((maxY - minY) / 2 + minY);

    console.log(`centroid x,y: ${centroidX}, ${centroidY}`);

    const countyQueryString = {
      geometry: `point:{"x":${centroidX},"y":${centroidY},"spatialReference":{"wkid":26912}}`,
      apiKey: process.env.MAPSERV_API_KEY,
    };
    const countyResponse = await got(`${countyUrl}?${new URLSearchParams(countyQueryString)}`, { headers }).json();

    console.log(`county search response: ${JSON.stringify(countyResponse)}`);
    if (countyResponse.result.length === 0) {
      return responseBuilder.speak(`A county was not found for zip code, ${zipCode}`).getResponse();
    }

    const countyName = countyResponse.result[0].attributes.name;

    return countyName.split(' ').map(capitalize).join(' ');
  } catch (error) {
    if (error.name !== 'ServiceError') {
      const response = responseBuilder.speak('Uh Oh. Looks like something went wrong.').getResponse();

      console.error(error);

      return response;
    }
    throw error;
  }
}
