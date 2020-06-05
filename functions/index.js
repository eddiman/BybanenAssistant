// Copyright 2018, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
const enturApi = require('./entur-api');
const responses = require('./responses');


// Import the Dialogflow module from the Actions on Google client library.
// Import the Dialogflow module and response creation dependencies from the
// Actions on Google client library.
const {
  dialogflow,
  Suggestions,
} = require('actions-on-google');

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});

const i18n = require('i18n');

i18n.configure({
  locales: ['en-US', 'no-NO'],
  directory: __dirname + '/locales',
  objectNotation: true,
  defaultLocale: 'en-US',
});


app.middleware((conv) => {
  conv.localize = () => {
    i18n.setLocale(conv.user.locale);
  };
});

/** INTENT**********************************************************************/

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
  conv.localize();

  conv.ask(i18n.__('WELCOME'));
  conv.ask(new Suggestions(i18n.__('FROM_BYPARKEN'), i18n.__('FROM_AIRPORT')));
});

/** INTENT**********************************************************************/

app.intent('AskForFromStop', (conv, {fromStopEntity}) => {
  conv.localize();
  conv.data.fromStopEntity = fromStopEntity;

  if (conv.data.fromStopEntity.toUpperCase() === 'byparken'.toUpperCase()) {
    return responses.sayDeparture(conv.data.fromStopEntity, 'bergen lufthavn', conv).then((res) => {});
  } else if (conv.data.fromStopEntity.toUpperCase() === 'bergen lufthavn'.toUpperCase()) {
    return responses.sayDeparture(conv.data.fromStopEntity, 'byparken', conv).then((res) => {});
  } else {
    conv.ask(i18n.__('FROM_DIRECTION', {from: fromStopEntity.capitalize()}));

    if (!conv.screen) {
      conv.ask(i18n.__('FROM_DIRECTION_HELPER'));
    } else {
      conv.ask(new Suggestions(i18n.__('BYPARKEN'), i18n.__('AIRPORT')));
    }
  }
});
/** INTENT**********************************************************************/

app.intent('AskForFromStop.AskForToStop', (conv, {toStopEntity}) => {
  conv.localize();

  return responses.sayDeparture(conv.data.fromStopEntity, toStopEntity, conv).then((res) => {});
});

app.catch((conv, error) => {
  console.error(error);
  conv.ask(i18n.__('ERROR'));
  conv.close();
});
/** INTENT**********************************************************************/

app.intent('GetNextTramFromToStop', (conv, {fromStopEntity, toStopEntity}) => {
  conv.localize();
  return responses.sayDeparture(fromStopEntity, toStopEntity, conv).then((res) => {});
});

app.intent('GetNextTramsFromOneStop', (conv, {fromStopEntity}) => {
  conv.localize();
  const fromStopIsByparken = (fromStopEntity.toUpperCase() == 'byparken'.toUpperCase());
  const fromStopIsAirport = (fromStopEntity.toUpperCase() == 'bergen lufthavn'.toUpperCase());

  return enturApi.getOnlyFromStop(fromStopEntity).then((res) =>{

    if (fromStopIsByparken || fromStopIsAirport) {
      conv.ask(responses.oneEndStopResponse(res[0], res[1]));
    }
    else {
      conv.ask(responses.oneStopResponse(res[0], res[1]));
    }

    conv.ask(responses.createOneStopTimeCard(res[0], res[1]));

    conv.close();
  });
});
/** INTENT**********************************************************************/

app.intent('actions_intent_NO_INPUT', (conv) => {
  conv.localize();

  // Use the number of reprompts to vary response
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
  if (repromptCount === 0) {
    conv.ask(i18n.__('NO_INPUT_1'));
  } else if (repromptCount === 1) {
    conv.ask(i18n.__('NO_INPUT_2'));
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
    conv.close(i18n.__('NO_INPUT_3'));
  }
});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
