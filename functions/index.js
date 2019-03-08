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


// Import the Dialogflow module from the Actions on Google client library.
// Import the Dialogflow module and response creation dependencies from the
// Actions on Google client library.
const {
  dialogflow,
  Permission,
  Suggestions,
  BasicCard,
  SimpleResponse,
  Button
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
  defaultLocale: 'en-US'
});


app.middleware((conv) => {
  conv.localize = () => {
    i18n.setLocale(conv.user.locale);
  };
});

/**INTENT**********************************************************************/

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
  conv.localize();

  conv.ask(i18n.__('WELCOME'));
  conv.ask(new Suggestions(i18n.__('FROM_BYPARKEN'), i18n.__('FROM_AIRPORT')));
});

/**INTENT**********************************************************************/

app.intent('AskForFromStop', (conv, {fromStopEntity}) => {
  conv.localize();
  conv.data.fromStopEntity = fromStopEntity

  if (conv.data.fromStopEntity.toUpperCase() === "byparken".toUpperCase()){
    return sayDeparture(conv.data.fromStopEntity, "bergen lufthavn", conv).then(res => {});

  } else if (conv.data.fromStopEntity.toUpperCase() === "bergen lufthavn".toUpperCase()) {
    return sayDeparture(conv.data.fromStopEntity, "byparken", conv).then(res => {});

  } else {
    conv.ask(i18n.__('FROM_DIRECTION', {from: fromStopEntity.capitalize()}))

    if(!conv.screen)  {
      conv.ask(i18n.__('FROM_DIRECTION_HELPER'));
    } else {
      conv.ask(new Suggestions(i18n.__('BYPARKEN'), i18n.__('AIRPORT')));
    }
  }
});
/**INTENT**********************************************************************/

app.intent('AskForFromStop.AskForToStop', (conv, {toStopEntity}) => {
  conv.localize();

  return sayDeparture(conv.data.fromStopEntity, toStopEntity, conv).then(res => {});

});
/*
app.catch((conv, error) => {
console.error(error);
conv.ask(i18n.__('ERROR'));
conv.close();
});*/
/**INTENT**********************************************************************/

app.intent('GetNextTramFromToStop', (conv, {fromStopEntity, toStopEntity}) => {
  conv.localize();
  return sayDeparture(fromStopEntity, toStopEntity, conv).then(res => {});


});

app.intent('GetNextTramsFromOneStop', (conv, {fromStopEntity}) => {
  conv.localize();

  return enturApi.getOnlyFromStop(fromStopEntity).then(res =>{
    conv.ask(oneStopResponse(res[0], res[1]));
    conv.close()
  });
});
/**INTENT**********************************************************************/

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


/**************RESPONSES************************/
async function sayDeparture(fromStop, toStop, conv) {
  return enturApi.getFromToStop(fromStop, toStop).then(res =>{
    let fromtopString = fromStop + "";
    let toStopString = toStop + "";

    if(!conv.screen) {
      conv.ask(standardResponse(res));
      conv.close();
    }
    else {
      conv.ask(standardResponse(res));
      conv.ask(createTimeCard(fromtopString, toStopString, res.departureLabel, res.formattedDepartureTime));
    }
    conv.close();
  }

)};


function standardResponse(formattedDeparture){
  const byparkenToAirport = (formattedDeparture.fromStop.toUpperCase() == "byparken".toUpperCase()) && (formattedDeparture.toStop.toUpperCase() == "bergen lufthavn".toUpperCase());
  const airportToByparken = (formattedDeparture.fromStop.toUpperCase() == "bergen lufthavn".toUpperCase()) && (formattedDeparture.toStop.toUpperCase() == "byparken".toUpperCase());

  if (byparkenToAirport || airportToByparken ){
    return firstLastStopResponse(formattedDeparture)
  } else {
    return new SimpleResponse({
      speech: i18n.__('STANDARD_RESPONSE', { tram: formattedDeparture.transportMode, from: formattedDeparture.fromStop, to: formattedDeparture.toStop, departureStop: formattedDeparture.departureLabel, departureTime: formattedDeparture.formattedDepartureTime, directionStop: formattedDeparture.directionStop}),
      text: i18n.__('STANDARD_RESPONSE', { tram: formattedDeparture.transportMode, from: formattedDeparture.fromStop, to: formattedDeparture.toStop, departureStop: formattedDeparture.departureLabel, departureTime: formattedDeparture.formattedDepartureTime, directionStop: formattedDeparture.directionStop})
    });
  }
}


function firstLastStopResponse(formattedDeparture){
  return new SimpleResponse({
    speech: i18n.__('FIRST_LAST_RESPONSE', { tram: formattedDeparture.transportMode, from: formattedDeparture.fromStop, departureStop: formattedDeparture.departureLabel, departureTime: formattedDeparture.formattedDepartureTime, directionStop: formattedDeparture.directionStop}),
    text: i18n.__('FIRST_LAST_RESPONSE', { tram: formattedDeparture.transportMode, from: formattedDeparture.fromStop, departureStop: formattedDeparture.departureLabel, departureTime: formattedDeparture.formattedDepartureTime, directionStop: formattedDeparture.directionStop})
  });
}

function oneStopResponse(formattedDeparture1, formattedDeparture2){
  return new SimpleResponse({
    speech: i18n.__('ONE_STOP_RESPONSE', {
      tram1: formattedDeparture1.transportMode,
      from1: formattedDeparture1.fromStop,
      departureStop1: formattedDeparture1.departureLabel,
      departureTime1: formattedDeparture1.formattedDepartureTime,
      directionStop1: formattedDeparture1.directionStop,
      departureStop2: formattedDeparture2.departureLabel,
      departureTime2: formattedDeparture2.formattedDepartureTime,
      directionStop2: formattedDeparture2.directionStop}),

      text: i18n.__('ONE_STOP_RESPONSE', {
        tram1: formattedDeparture1.transportMode,
        from1: formattedDeparture1.fromStop,
        departureStop1: formattedDeparture1.departureLabel,
        departureTime1: formattedDeparture1.formattedDepartureTime,
        directionStop1: formattedDeparture1.directionStop,
        departureStop2: formattedDeparture2.departureLabel,
        departureTime2: formattedDeparture2.formattedDepartureTime,
        directionStop2: formattedDeparture2.directionStop})
      });
    }


    function createTimeCard(fromStop, toStop, timeLeftToDep, formattedDepartureTime ){
      const title = i18n.__('CARD_TITLE', {timeLeft : timeLeftToDep});
      const subtitle = i18n.__('CARD_SUBTITLE', {from : fromStop.capitalize(), to : toStop.capitalize(), time : formattedDepartureTime})

      const card = new BasicCard({

        title: title,
        subtitle: subtitle,
        buttons: new Button({
          title: i18n.__('CARD_MORE_INFO'),
          url: 'https://skyss.no/',
        }),
        image: {
          url: 'https://firebasestorage.googleapis.com/v0/b/bybanen-b14cf.appspot.com/o/bybanen_v3.gif?alt=media&token=03f37481-0061-4930-a0f7-b61b880539ef',
          accessibilityText: 'Bergen Light Rail',
        },
        display: 'WHITE',

      });

      return card;
    }

    String.prototype.capitalize = function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
    }


    // Set the DialogflowApp object to handle the HTTPS POST request.
    exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
