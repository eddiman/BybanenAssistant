const enturApi = require('./entur-api');
const i18n = require('i18n');
const {
    BasicCard,
    SimpleResponse,
    Button,
} = require('actions-on-google');
module.exports = {

    sayDeparture : async function (fromStop, toStop, conv) {
        return enturApi.getFromToStop(fromStop, toStop).then(res =>{
                let fromStopString = fromStop + "";
                let toStopString = toStop + "";

                if(!conv.screen) {
                    conv.ask(standardResponse(res));
                    conv.close();
                }
                else {
                    conv.ask(standardResponse(res));
                    conv.ask(createTimeCard(fromStopString, toStopString, res.departureLabel, res.formattedDepartureTime));
                }
                conv.close();
            }

        )},
    standardResponse : function (formattedDeparture){
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
    },


    firstLastStopResponse: function (formattedDeparture) {
        return new SimpleResponse({
            speech: i18n.__('FIRST_LAST_RESPONSE', {tram: formattedDeparture.transportMode, from: formattedDeparture.fromStop, departureStop: formattedDeparture.departureLabel, departureTime: formattedDeparture.formattedDepartureTime, directionStop: formattedDeparture.directionStop}),
            text: i18n.__('FIRST_LAST_RESPONSE', {tram: formattedDeparture.transportMode, from: formattedDeparture.fromStop, departureStop: formattedDeparture.departureLabel, departureTime: formattedDeparture.formattedDepartureTime, directionStop: formattedDeparture.directionStop}),
        });
    },

    oneStopResponse : function (formattedDeparture1, formattedDeparture2) {
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
                directionStop2: formattedDeparture2.directionStop}),
        });
    },
    oneEndStopResponse: function (formattedDeparture1, formattedDeparture2) {
        return new SimpleResponse({
            speech: i18n.__('ONE_END_STOP_RESPONSE', {
                tram1: formattedDeparture1.transportMode,
                from1: formattedDeparture1.fromStop,
                departureStop1: formattedDeparture1.departureLabel,
                departureTime1: formattedDeparture1.formattedDepartureTime,
                directionStop1: formattedDeparture1.directionStop,
                departureStop2: formattedDeparture2.departureLabel,
                departureTime2: formattedDeparture2.formattedDepartureTime,
                directionStop2: formattedDeparture2.directionStop}),

            text: i18n.__('ONE_END_STOP_RESPONSE', {
                tram1: formattedDeparture1.transportMode,
                from1: formattedDeparture1.fromStop,
                departureStop1: formattedDeparture1.departureLabel,
                departureTime1: formattedDeparture1.formattedDepartureTime,
                directionStop1: formattedDeparture1.directionStop,
                departureStop2: formattedDeparture2.departureLabel,
                departureTime2: formattedDeparture2.formattedDepartureTime,
                directionStop2: formattedDeparture2.directionStop}),
        });
    },


    createTimeCard : function (fromStop, toStop, timeLeftToDep, formattedDepartureTime ) {
        const title = i18n.__('CARD_TITLE', {timeLeft: timeLeftToDep});
        const subtitle = i18n.__('CARD_SUBTITLE', {from: fromStop.capitalize(), to: toStop.capitalize(), time: formattedDepartureTime});

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
    },

    createOneStopTimeCard: function (firstDeparture, secondDeparture ) {
        const title = i18n.__('CARD_TITLE', {timeLeft: firstDeparture.formattedDepartureTime});
        const subtitle = i18n.__('CARD_SUBTITLE_ONE_STOP', {from: firstDeparture.fromStop.capitalize(), time: firstDeparture.formattedDepartureTime, to: firstDeparture.directionStop});
        const subtitle2 = i18n.__('CARD_SUBTITLE_ONE_STOP_2', {time2: secondDeparture.formattedDepartureTime, to2: secondDeparture.directionStop});

        const card = new BasicCard({

            title: title,
            subtitle: subtitle + ' ' + subtitle2,
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
}
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
