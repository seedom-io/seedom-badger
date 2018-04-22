const express = require('express');
const app = express();
const moment = require('moment-timezone');
const download = require('./lib/download');
const file = require('./lib/file');
const web3 = require('./lib/web3');
const bytes = require('./lib/bytes');
const draw = require('./lib/draw');
const circles = require('./lib/circles');
const { createCanvas, loadImage, registerFont } = require('canvas');

// size
const canvasW = 1200;
const canvasH = 628;

// base urls
const badgeUrl = 'https://raw.githubusercontent.com/seedom-io/seedom-assets/master/badge/seedom-badge.png';
const causeImageUrlTemplate = 'https://raw.githubusercontent.com/seedom-io/seedom-assets/master/causes/{cause}.png';
const causeJsonUrlTemplate = 'https://raw.githubusercontent.com/seedom-io/seedom-assets/master/causes/{cause}.json';

// register font
registerFont('./fonts/CamphorPro.ttf', {family: 'CamphorPro'});

(async () => {

    // download badge image
    const badgeImage = await download.image(badgeUrl);
    // load configs
    const networks = await file.readJson('./networks.json');
    const deployments = await file.readJson('./deployments.json');
    // create fundraiser
    const fundraiser = web3.fundraiser(networks, deployments);
    // get deployment
    const deployment = await fundraiser.methods.deployment().call();
    // get cause and cause url
    const cause = deployment._cause.toLowerCase();
    const causeImageUrl = causeImageUrlTemplate.replace('{cause}', cause);
    const causeImage = await download.image(causeImageUrl);
    const causeJsonUrl = causeJsonUrlTemplate.replace('{cause}', cause);
    const causeJson = await download.json(causeJsonUrl);
    const causeTaglineText = `${causeJson.tagline.toUpperCase()}!`;
    // get end time
    const endTime = moment(deployment._endTime * 1000).tz('America/New_York');
    const endTimeTopText = endTime.format('LL');
    const endTimeBottomText = endTime.format('ha z');

    // set up endpoint
    app.get('/:participant([a-zA-Z0-9]*)', async (request, response) => {
        // setup canvas
        const canvas = createCanvas(canvasW, canvasH);
        var context = canvas.getContext('2d');
    
        // draw badge & cause
        context.drawImage(badgeImage, 0, 0, badgeImage.width, badgeImage.height);
        context.drawImage(causeImage, 412, 115, causeImage.width, causeImage.height);

        // get requested participant & message
        const participant = await fundraiser.methods.participants(
            `0x${request.params.participant.toLowerCase()}`
        ).call();
        const participantMessage = bytes.string(participant._message);

        // draw participant message
        context.fillStyle = 'white';
        context.font = '36px CamphorPro';
        draw.wrapText(context, participantMessage, 46, 80, 204, 37);

        // draw deployment end time
        context.textAlign = 'right'; 
        context.fillText(endTimeTopText, 1174, 556);
        context.fillText(endTimeBottomText, 1174, 596);

        // draw circle texts
        context.fillStyle = 'white';
        context.font = '46px CamphorPro';
        let circle = circles.get(586, canvasW, canvasH);
        draw.circleText(context, 'I HELPED', circle, 0, 'center', 46, true, 0);
        circle = circles.get(606, canvasW, canvasH);
        draw.circleText(context, causeTaglineText, circle, 180, 'center', 46, false, 0);

        // pipe back out
        const stream = canvas.createPNGStream();
        response.type('png');
        stream.pipe(response);
    });

    app.listen(3000);

})();