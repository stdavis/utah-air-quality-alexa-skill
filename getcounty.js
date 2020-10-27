const fetch = require('node-fetch');
const capitalize = require('lodash.capitalize');
const queryString = require('query-string');


const baseUrl = 'https://api.mapserv.utah.gov/api/v1/search/';
const zipUrl = `${baseUrl}SGID10.Boundaries.ZipCodes/ZIP5,shape@envelope`;
const countyUrl = `${baseUrl}SGID10.Boundaries.Counties/NAME`;
const headers = {
  "Referer": "https://utah-air-quality-alexa-skill.com"
};

module.exports = async (handlerInput) => {
  console.log('getcounty');

  const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
  const consentToken = requestEnvelope.context.System.user.permissions
      && requestEnvelope.context.System.user.permissions.consentToken;
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

    let zipResponse;
    try {
      const qs = {
        predicate: `ZIP5 = '${zipCode}'`,
        apiKey: process.env.MAPSERV_API_KEY
      };
      let response = await fetch(`${zipUrl}?${queryString.stringify(qs)}`, { headers });
      zipResponse = await response.json();
    } catch (error) {
      console.error(`error with zip search: ${error}`);
    }

    console.log(`zip search response: ${JSON.stringify(zipResponse)}`);
    if (zipResponse.result.length === 0) {
      return responseBuilder
        .speak(`Zip code, ${zipCode} was not found in Utah!`)
        .getResponse();
    }

    // get centroid
    const geometry = zipResponse.result[0].geometry;
    let maxX, maxY, minX, minY;
    geometry.rings[0].forEach(coords => {
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

    const centroidX = Math.round((maxX - minX)/2 + minX);
    const centroidY = Math.round((maxY - minY)/2 + minY);

    console.log(`centroid x,y: ${centroidX}, ${centroidY}`);

    let countyResponse;
    try {
      const qs = {
        geometry: `point:{"x":${centroidX},"y":${centroidY},"spatialReference":{"wkid":26912}}`,
        apiKey: process.env.MAPSERV_API_KEY
      };
      let response = await fetch(`${countyUrl}?${queryString.stringify(qs)}`, { headers });
      countyResponse = await response.json();
    } catch (error) {
      console.error(`error with county request: ${error}`);
    }

    console.log(`county search response: ${JSON.stringify(countyResponse)}`);
    if (countyResponse.result.length === 0) {
      return responseBuilder
        .speak(`A county was not found for zip code, ${zipCode}`)
        .getResponse();
    }

    const countyName = countyResponse.result[0].attributes.name;
    return countyName.split(' ').map(capitalize).join(' ');
  } catch (error) {
    if (error.name !== 'ServiceError') {
      const response = responseBuilder
        .speak('Uh Oh. Looks like something went wrong.')
        .getResponse();

      console.error(error);

      return response;
    }
    throw error;
  }
};
