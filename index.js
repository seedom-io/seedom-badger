const express = require('express');
const app = express();
const file = require('./lib/file');
const download = require('./lib/download');
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

// create circles
const topCircle = circles.get(586, canvasW, canvasH);
const bottomCircle = circles.get(606, canvasW, canvasH);

// register font
registerFont('./fonts/CamphorPro.ttf', {family: 'CamphorPro'});

(async () => {

    // download badge image
    const badgeImage = await download.image(badgeUrl);
    // load configs
    const config = {
        networks: await file.readJson('./config/networks.json'),
        deployments: await file.readJson('./config/deployments.json')
    };

    // get fundraisers, deployments, and causes
    const fundraisers = web3.fundraisers(config);
    const deployments = await web3.deployments(fundraisers);
    const causes = await web3.causes(deployments);

    // set up endpoint
    app.get('/:fundraiser([a-zA-Z0-9]*)/:participant([a-zA-Z0-9]*).png', async (request, response) => {

        const fundraiserAddress = `0x${request.params.fundraiser}`;
        // verify we have fundraiser
        if (!(fundraiserAddress in fundraisers)) {
            response.status(404).send("fundraiser not found");
            return;
        }
        // verify we have deployment
        if (!(fundraiserAddress in deployments)) {
            response.status(404).send("deployment not found");
            return;
        }
        // verify we have cause
        if (!(fundraiserAddress in causes)) {
            response.status(404).send("cause not found");
            return;
        }

        // get fundraiser, deployment, and cause
        const fundraiser = fundraisers[fundraiserAddress];
        const deployment = deployments[fundraiserAddress];
        const cause = causes[fundraiserAddress];
        
        // get requested participant & message
        const participantAddress = `0x${request.params.participant}`;
        const participant = await fundraiser.methods.participants(participantAddress).call();
        if (participant._entries == 0) {
            res.status(404).send("participant not found");
            return;
        }

        // get participant message
        const participantMessage = bytes.string(participant._message);

        // setup canvas
        const canvas = createCanvas(canvasW, canvasH);
        const context = canvas.getContext('2d');
        // draw badge & cause
        context.drawImage(badgeImage, 0, 0, badgeImage.width, badgeImage.height);
        context.drawImage(cause.image, 412, 115, cause.image.width, cause.image.height);

        // draw participant message
        context.fillStyle = 'white';
        context.font = '36px CamphorPro';
        draw.wrapText(context, participantMessage, 46, 80, 204, 37);

        // draw deployment end time
        context.textAlign = 'right'; 
        context.fillText(deployment.endTime.top, 1174, 556);
        context.fillText(deployment.endTime.bottom, 1174, 596);

        // draw circle texts
        context.fillStyle = 'white';
        context.font = '46px CamphorPro';
        draw.circleText(context, 'I HELPED', topCircle, 0, 'center', 46, true, 0);
        draw.circleText(context, cause.tagline, bottomCircle, 180, 'center', 46, false, 0);

        // pipe back out
        const stream = canvas.createPNGStream();
        response.type('png');
        stream.pipe(response);
    });

    app.listen(3000);

})();