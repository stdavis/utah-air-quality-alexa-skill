import Alexa from 'ask-sdk-core';
import 'dotenv/config';
import airquality from './airquality.js';
import getcounty from './getcounty.js';

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    console.log(`REQUEST: ${JSON.stringify(handlerInput.response)}`);
    const county = await getcounty(handlerInput);

    // there was a problem getting the county
    if (typeof county !== 'string') {
      return county;
    }

    try {
      const response = await airquality(county);

      return handlerInput.responseBuilder
        .speak(`Today is a ${response.color} day in ${response.county} county`)
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder.speak(error.error.message).getResponse();
    }
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Sorry, I can't understand the command. Please say again.")
      .reprompt("Sorry, I can't understand the command. Please say again.")
      .getResponse();
  },
};

export const handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(LaunchRequestHandler)
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
