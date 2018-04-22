const express = require('express');
const app = express();
const request = require('request');
const fs = require('fs');
const Web3 = require('web3');
const { createCanvas, loadImage, registerFont, Image } = require('canvas');

// register font
registerFont('./fonts/CamphorPro.ttf', {family: 'CamphorPro'});
// base urls
const badgeUrl = 'https://raw.githubusercontent.com/seedom-io/seedom-assets/master/badge/seedom-badge.png';
const causeUrlTemplate = 'https://raw.githubusercontent.com/seedom-io/seedom-assets/master/causes/{cause}.png';

const downloadImage = (url, done) => {
    // download background image
    request({
        url: url,
        encoding: null
    }, (error, response, body) => {
        const image = new Image();
        image.src = body;
        done(image);
    });
};

let badgeImage;
// download badge image
downloadImage(badgeUrl, (image) => { badgeImage = image; });

const readJsonFile = (file) => {
    const json = fs.readFileSync(file, 'utf8');
    return JSON.parse(json);
};

// load configs
const networks = readJsonFile('./networks.json');
const deployments = readJsonFile('./deployments.json');

// get network name
const networkName = process.argv.length > 2 ? process.argv[2] : 'mainnet';

// setup web3 (to latest fundraiser contract)
const network = networks[networkName];
const web3 = new Web3(network.url);
const release = deployments[networkName].fundraiser[0];
const fundraiser = new web3.eth.Contract(release.abi, release.address);

let causeImage;
let endTimeText;
// download cause image & get end data
fundraiser.methods.deployment().call().then((deployment) => {
    const cause = deployment._cause.toLowerCase();
    const causeUrl = causeUrlTemplate.replace('{cause}', cause);
    downloadImage(causeUrl, (image) => { causeImage = image; });
    const endTime = new Date(deployment._endTime * 1000);
    endTimeText = endTime.toLocaleString(undefined, {
        timeZoneName: 'short',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });
});

const stringBytes = (bytes) => {
    const bytesMeat = bytes.substr(2);
    const buffer = Buffer.from(bytesMeat, 'hex');
    return buffer.toString().replace(/\0/g, '');
};

const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
    
    var words = text.split(' '),
        line = '',
        lineCount = 0,
        i,
        test,
        metrics;

    for (i = 0; i < words.length; i++) {
        test = words[i];
        metrics = context.measureText(test);
        while (metrics.width > maxWidth) {
            // Determine how much of the word will fit
            test = test.substring(0, test.length - 1);
            metrics = context.measureText(test);
        }
        if (words[i] != test) {
            words.splice(i + 1, 0,  words[i].substr(test.length))
            words[i] = test;
        }  

        test = line + words[i] + ' ';  
        metrics = context.measureText(test);
        
        if (metrics.width > maxWidth && i > 0) {
            context.fillText(line, x, y);
            line = words[i] + ' ';
            y += lineHeight;
            lineCount++;
        }
        else {
            line = test;
        }
    }

    context.fillText(line, x, y);
};

function circleText(context, text, x, y, diameter, startAngle, align, textInside, textHeight, inwardFacing, kerning) {
    // text:         The text to be displayed in circular fashion
    // diameter:     The diameter of the circle around which the text will
    //               be displayed (inside or outside)
    // startAngle:   In degrees, Where the text will be shown. 0 degrees
    //               if the top of the circle
    // align:        Positions text to left right or center of startAngle
    // textInside:   true to show inside the diameter. False to show outside
    // inwardFacing: true for base of text facing inward. false for outward
    // kearning:     0 for normal gap between letters. positive or
    //               negative number to expand/compact gap in pixels
 //------------------------------------------------------------------------

    // declare and intialize canvas, reference, and useful variables
    align = align.toLowerCase();
    var clockwise = align == "right" ? 1 : -1; // draw clockwise for aligned right. Else Anticlockwise
    startAngle = startAngle * (Math.PI / 180); // convert to radians
    
    // in cases where we are drawing outside diameter,
    // expand diameter to handle it
    if (!textInside) diameter += textHeight * 2;
    
    // Reverse letters for align Left inward, align right outward 
    // and align center inward.
    if (((["left", "center"].indexOf(align) > -1) && inwardFacing) || (align == "right" && !inwardFacing)) text = text.split("").reverse().join(""); 
    
    // Setup letters and positioning
    context.translate(diameter / 2 + x, diameter / 2 + y); // Move to center
    startAngle += (Math.PI * !inwardFacing); // Rotate 180 if outward
    context.textBaseline = 'middle'; // Ensure we draw in exact center
    context.textAlign = 'center'; // Ensure we draw in exact center

    // rotate 50% of total angle for center alignment
    if (align == "center") {
        for (var j = 0; j < text.length; j++) {
            var charWid = context.measureText(text[j]).width;
            startAngle += ((charWid + (j == text.length-1 ? 0 : kerning)) / (diameter / 2 - textHeight)) / 2 * -clockwise;
        }
    }

    // Phew... now rotate into final start position
    context.rotate(startAngle);

    // Now for the fun bit: draw, rotate, and repeat
    for (var j = 0; j < text.length; j++) {
        var charWid = context.measureText(text[j]).width; // half letter
        // rotate half letter
        context.rotate((charWid/2) / (diameter / 2 - textHeight) * clockwise); 
        // draw the character at "top" or "bottom" 
        // depending on inward or outward facing
        context.fillText(text[j], 0, (inwardFacing ? 1 : -1) * (0 - diameter / 2 + textHeight / 2));
        context.rotate((charWid/2 + kerning) / (diameter / 2 - textHeight) * clockwise); // rotate half letter
    }

}

app.get('/:participant', async (request, response) => {
    // setup canvas
    const canvas = createCanvas(1200, 628);
    var context = canvas.getContext('2d');

    // draw badge
    context.drawImage(badgeImage, 0, 0, badgeImage.width, badgeImage.height);
    // draw cause
    context.drawImage(causeImage, 412, 115, causeImage.width, causeImage.height);

    const { participant } = request.params;
    const participantObj = await fundraiser.methods.participants(participant).call();

    // draw participant message
    context.fillStyle = 'white';
    context.font = '36px CamphorPro';
    const participantMessage = stringBytes(participantObj._message);
    wrapText(context, participantMessage, 46, 80, 204, 37);

    // draw end time
    context.font = '36px CamphorPro';
    context.textAlign = 'right'; 
    context.fillText(endTimeText, 1180, 600);

    circleText(context, 'I HELPED', 350, 64, 500, 0, 'center', true, 36, true, 0);

    // pipe back out
    const stream = canvas.createPNGStream();
    response.type('png');
    stream.pipe(response);

});
 
app.listen(3000);