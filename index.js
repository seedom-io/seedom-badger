const express = require('express');
const app = express();
const file = require('./lib/file');
const download = require('./lib/download');
const web3 = require('./lib/web3');
const draw = require('./lib/draw');
const circles = require('./lib/circles');
const messages = require('@seedom-io/seedom-crypter/messages');
const { createCanvas, loadImage, registerFont } = require('canvas');

// size
const canvasW = 1200;
const canvasH = 628;

// base urls
const badgeUrl = 'https://raw.githubusercontent.com/seedom-io/seedom-assets/master/badge/seedom-badge.png';

// filename
const fileName = "badge.png";

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
    app.get('/badges/:network([a-z]*)/:fundraiser([a-zA-Z0-9]*)/:participant([a-zA-Z0-9]*).png',
        async (request, response) => {

        const networkName = request.params.network;
        // verify we have network
        if (!(networkName in fundraisers)) {
            response.status(404).send("network not found");
            return;
        }

        // get network sets
        const networkFundraisers = fundraisers[networkName];
        const networkDeployments = deployments[networkName];
        const networkCauses = causes[networkName];

        const fundraiserAddress = `0x${request.params.fundraiser}`;
        // verify we have fundraiser
        if (!(fundraiserAddress in networkFundraisers)) {
            response.status(404).send("fundraiser not found");
            return;
        }
        // verify we have deployment
        if (!(fundraiserAddress in networkDeployments)) {
            response.status(404).send("deployment not found");
            return;
        }
        // verify we have cause
        if (!(fundraiserAddress in networkCauses)) {
            response.status(404).send("cause not found");
            return;
        }

        // get network fundraiser, deployment, and cause
        const networkFundraiser = networkFundraisers[fundraiserAddress];
        const networkDeployment = networkDeployments[fundraiserAddress];
        const networkCause = networkCauses[fundraiserAddress];
        
        // get requested participant & message
        const participantAddress = `0x${request.params.participant}`;
        let participant;

        try {
            participant = await networkFundraiser.methods.participants(
                participantAddress
            ).call();
        } catch (error) {
            response.status(404).send("error finding participant");
            return;
        }

        if (participant._entries == 0) {
            response.status(404).send("participant not found");
            return;
        }

        // get participant message
        const participantMessage = messages.message(participant._message);

        // setup canvas
        const canvas = createCanvas(canvasW, canvasH);
        const context = canvas.getContext('2d');
        // draw badge & cause
        context.drawImage(badgeImage, 0, 0, badgeImage.width, badgeImage.height);
        context.drawImage(networkCause.image, 412, 115, networkCause.image.width, networkCause.image.height);

        // draw participant message
        context.fillStyle = 'white';
        context.font = '36px CamphorPro';
        draw.wrapText(context, participantMessage, 46, 80, 204, 37);

        // draw deployment end time
        context.textAlign = 'right'; 
        context.fillText(networkDeployment.endTime.top, 1174, 556);
        context.fillText(networkDeployment.endTime.bottom, 1174, 596);

        // draw circle texts
        context.fillStyle = 'white';
        context.font = '46px CamphorPro';
        draw.circleText(context, 'I HELPED', topCircle, 0, 'center', 46, true, 0);
        draw.circleText(context, networkCause.tagline, bottomCircle, 180, 'center', 46, false, 0);

        // pipe back out
        const stream = canvas.createPNGStream();
        response.set('Content-Disposition', `attachment;filename=${fileName}`);
        response.type('png');
        stream.pipe(response);
    });

    app.listen(3000);

})();