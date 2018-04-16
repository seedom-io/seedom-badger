var express = require('express');
var app = express();
var fs = require('fs');
var request = require('request');
const { createCanvas, loadImage, registerFont, Image } = require('canvas');
registerFont('./fonts/CamphorPro-Regular.ttf', {family: 'CamphorPro'});

const background = new Image;
request('https://github.com/seedom-io/seedom-assets/raw/master/ticket/seedom-ticket.png', (error, response, body) => {
    background.src = body;
});

http.get(url)
.on('response', function(res) {

  // http://stackoverflow.com/a/14269536/478603
  var chunks = []
  res.on('data', function(data) {
    chunks.push(data)
  })
  res.on('end', function() {
    var img = new Canvas.Image()
    img.src = Buffer.concat(chunks)
    cb(null, img)
  })

})
.on('error', function(err) {
  cb(err)
})

//:contract/:participant
app.get('/', (request, response) => {

    const canvas = createCanvas(1200, 628);
    // setup context
    var ctx = canvas.getContext('2d');
    ctx.font = '30px CamphorPro';
    // draw background
    ctx.drawImage(background, 0, 0, background.width, background.height);
    ctx.fillText("Awesome!", 50, 100);
    var stream = canvas.createPNGStream();
    response.type("png");
    stream.pipe(response);

});
 
app.listen(3000);