const EnturService = require('@entur/sdk').default;
const convertFeatureToLocation = require('@entur/sdk').convertFeatureToLocation;
const service = new EnturService({ clientName: 'Pires-BybaneAssistant' })
const i18n = require('i18n');


module.exports = {

  getFromToStop : async function(fromStop1, toStop1){
    let fromStop = fromStop1+ "";
    let toStop = toStop1 + "";
    const now = new Date();
    const departures =  await service.getStopPlaceDepartures(tramStops[fromStop])
    let thisDeparture = [];
    let formattedDeparture = {};

    const direction = determineDirection(fromStop, toStop);

    for (var i = 0; i < departures.length; i++) {
      let thisDeparture = departures[i];

      if(thisDeparture.destinationDisplay.frontText.toUpperCase() === direction.toUpperCase()){

        const expectedDepartureTime = thisDeparture.expectedDepartureTime;
        const destinationDisplay = thisDeparture.destinationDisplay;
        const serviceJourney = thisDeparture.serviceJourney;
        const line = serviceJourney.journeyPattern.line;

        const departureTime = new Date(expectedDepartureTime)
        const minDiff = minutesDifference(now, departureTime)
        const departureLabel = minDiff == 0 ? i18n.__('NOW') : (minDiff < 15 ? minutesLeftString(minDiff) : toTimeString(departureTime))

        formattedDeparture = {
          fromStop : fromStop.capitalize(),
          toStop : toStop.capitalize(),
          formattedDepartureTime : toTimeString(departureTime),
          departureLabel : departureLabel,
          directionStop : destinationDisplay.frontText,
          transportMode : line.transportMode
        }

        return formattedDeparture;
      }
    }
  }
}

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
  "slettebakken" : "NSR:StopPlace:31384",
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
  "birkelandsskiftet terminal" : "NSR:StopPlace:30162",
  "kokstadflaten" : "NSR:StopPlace:30159",
  "bergen lufthavn" : "NSR:StopPlace:30156",
}

function determineDirection(fromStop, toStop){
  let fromStopPos = 0;
  let toStopPos = 0;
  let counter = 0;
  for (var key in tramStops) {
    counter++;
    if (fromStop.toUpperCase() === key.toUpperCase()){
      fromStopPos = counter;

    }

    if (toStop.toUpperCase() === key.toUpperCase()){
      toStopPos = counter;
    }
  }

  if(fromStopPos < toStopPos){
    return "bergen lufthavn";
  } else {
    return "byparken";
  }
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

function minutesLeftString(minDiff) {
  if (minDiff == 1) {
    return  i18n.__('IN_MINUTE', {diffMin : minDiff});
  } else {
    return  i18n.__('IN_MINUTES', {diffMin : minDiff});
  }
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}
