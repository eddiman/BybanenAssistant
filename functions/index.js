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

const EnturService = require('@entur/sdk').default;
const convertFeatureToLocation = require('@entur/sdk').convertFeatureToLocation;
console.log(EnturService)
const service = new EnturService({ clientName: 'Pires-BybaneAssistant' })

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


// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
  conv.ask(`<speak>Hello! From where do you want to take the light rail from?</speak>`)
  conv.ask(new Suggestions('from Byparken', 'from Bergen Lufthavn'));
});



app.intent('TestStop', (conv) => {
});

app.intent('AskForFromStop', (conv, {fromStopEntity}) => {
  conv.data.fromStopEntity = fromStopEntity

  if (conv.data.fromStopEntity.toUpperCase() === "byparken".toUpperCase())
  {
    return getFromToStop(conv.data.fromStopEntity, "bergen lufthavn").then(res => {

      if(!conv.screen) {
        conv.ask(new SimpleResponse({
          speech: `Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}</speak>`,
          text: `Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}</speak>`,
        }))


      } else {

      conv.ask(`Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}`, createTimeCard(conv.data.fromStopEntity, "bergen lufthavn".capitalize(), res.departureLabel, res.formattedDepartureTime));

      }
      conv.close()

    })

    //conv.ask(new Suggestions('Towards Bergen Lufthavn'));
  } else if (conv.data.fromStopEntity.toUpperCase() === "bergen lufthavn".toUpperCase()) {
    return getFromToStop(conv.data.fromStopEntity, "byparken").then(res => {

      if(!conv.screen) {
        conv.ask(new SimpleResponse({
          speech: `Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}</speak>`,
          text: `Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}</speak>`,
        }))


      } else {

      conv.ask(`Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}`, createTimeCard(conv.data.fromStopEntity, "byparken".capitalize(), res.departureLabel, res.formattedDepartureTime));

      }

      conv.close()

    })

  } else {
    conv.ask(`<speak>Ok, you want to leave from ${fromStopEntity.capitalize()}. Which direction do you want to go towards?</speak>`)

    if(!conv.screen)  {
      conv.ask(`<speak>The two directions are towards Byparken or Bergen Lufthavn</speak>`)

    } else {
      conv.ask(new Suggestions('Towards Byparken', 'Towards Bergen Lufthavn'));
    }
  }
});

app.intent('AskForToStop', (conv, {toStopEntity}) => {

  return getFromToStop(conv.data.fromStopEntity, toStopEntity).then(res =>{
    //conv.ask(`<speak>Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}</speak>`)

    if(!conv.screen) {
      conv.ask(new SimpleResponse({
        speech: `Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}</speak>`,
        text: `Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}</speak>`,
      }))


    } else {

    conv.ask(`Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}`, createTimeCard(conv.data.fromStopEntity, toStopEntity, res.departureLabel, res.formattedDepartureTime));

    }

    conv.close();

  })

});

app.intent('GetNextTramFromToStop', (conv, {fromStopEntity, toStopEntity}) => {

  return getFromToStop(fromStopEntity, toStopEntity).then(res => {
    if(!conv.screen) {
      conv.ask(new SimpleResponse({
        speech: `Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}</speak>`,
        text: `Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}</speak>`,
      }))


    } else {
    conv.ask(`Got it, the next ${res.transportMode} from ${res.fromStop} leaves in ${res.departureLabel} at ${res.formattedDepartureTime} towards ${res.directionStop}`, createTimeCard(fromStopEntity, toStopEntity, res.departureLabel, res.formattedDepartureTime));

    }

  })

});

function createTimeCard(fromStop, toStop, timeLeftToDep, formattedDepartureTime ){
  let title = "Next light rail leaves in " + timeLeftToDep;
  let subtitle = "From " + fromStop.capitalize() + " towards " + toStop.capitalize() + " at " + formattedDepartureTime;

  return new BasicCard({

    title: title,
    subtitle: subtitle,
    buttons: new Button({
      title: 'More info on skyss.no',
      url: 'https://skyss.no/',
    }),
    image: {
      url: 'https://firebasestorage.googleapis.com/v0/b/bybanen-b14cf.appspot.com/o/bybanen_new.gif?alt=media&token=8705fc1a-6eee-4d61-bece-d69b3809801b',
      accessibilityText: 'Bergen Light Rail',
    },
    display: 'WHITE',

  })
}

app.intent('actions_intent_NO_INPUT', (conv) => {
  // Use the number of reprompts to vary response
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
  if (repromptCount === 0) {
    conv.ask(`I didn't hear anything.`);
  } else if (repromptCount === 1) {
    conv.ask(`Please say the name of a stop.`);
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
    conv.close(`I couldn't hear anything from you, so I'm ending this conversation, bye!`);
  }
});



const tramStops = {
  "byparken": "NSR:StopPlace:30859",
  "nonneseter": "NSR:StopPlace:30862",
  "bystasjonen": "NSR:StopPlace:30865",
  "nygård" : "NSR:StopPlace:30867",
  "florida" : "NSR:StopPlace:30917",
  "danmarks plass" : "NSR:StopPlace:31372",
  "kronstad" : "NSR:StopPlace:31374",
  "brann stadion" : "NSR:StopPlace:31377",
  "wergeland" : "NSR:StopPlace:31379",
  "sletten" : "NSR:StopPlace:31382",
  "fantoft" : "NSR:StopPlace:31388",
  "paradis" : "NSR:StopPlace:29298",
  "hop" : "NSR:StopPlace:29815",
  "nesttun terminal" : "NSR:StopPlace:29820",
  "nesttun sentrum" : "NSR:StopPlace:29817",
  "skjoldskiftet" : "NSR:StopPlace:29824",
  "mårdalen" : "NSR:StopPlace:29827",
  "skjold" : "NSR:StopPlace:29830",
  "lagunen" : "NSR:StopPlace:30138",
  "råstølen" : "NSR:StopPlace:30081",
  "sandslivegen" : "NSR:StopPlace:30143",
  "sandslimarka" : "NSR:StopPlace:30148",
  "kokstad" : "NSR:StopPlace:30154",
  "kokstadflaten" : "NSR:StopPlace:30159",
  "bergen lufthavn" : "NSR:StopPlace:30156",

}

function toTimeString(date) {

  const hour = String(date.getHours() + 1).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

function minutesDifference(date1, date2) {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime())
  return Math.floor(timeDiff / (1000 * 60))
}

async function getFromToStop(fromStop, toStop){
  const now = new Date();
  //const departures =  await service.getStopPlaceDepartures(tramStops[fromStop])
  const departures =  await service.getStopPlaceDepartures(tramStops[fromStop])
  let thisDeparture = [];
  let formattedDeparture = {};

  for (var i = 0; i < departures.length; i++) {
    let thisDeparture = departures[i];
    if(thisDeparture.destinationDisplay.frontText.toUpperCase() === toStop.toUpperCase()){
      //thisDeparture = departure;


      const expectedDepartureTime = thisDeparture.expectedDepartureTime;
      const destinationDisplay = thisDeparture.destinationDisplay;
      const serviceJourney = thisDeparture.serviceJourney;
      //const { line } = serviceJourney.journeyPattern
      const line = serviceJourney.journeyPattern.line;

      const departureTime = new Date(expectedDepartureTime)
      const minDiff = minutesDifference(now, departureTime)
      const departureLabel = minDiff == 0 ? "now" : (minDiff < 15 ? `${minDiff} minutes` : toTimeString(departureTime))

      formattedDeparture = {
        fromStop : fromStop.capitalize(),
        formattedDepartureTime : toTimeString(departureTime),
        departureLabel : departureLabel,
        directionStop : destinationDisplay.frontText,
        transportMode : line.transportMode
      }

      //console.log(`${departureLabel} ${line.transportMode} ${line.publicCode} ${destinationDisplay.frontText}`)
      //return `the next ${line.transportMode} from ${fromStop.capitalize()} leaves in ${departureLabel} at ${toTimeString(departureTime)} towards ${destinationDisplay.frontText}.`
      return formattedDeparture;
    }
  }
}


String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}


// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
