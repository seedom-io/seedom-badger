module.exports.wrapText = (context, text, x, y, maxWidth, lineHeight) => {
    
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
        } else {
            line = test;
        }
    }

    context.fillText(line, x, y);
};

module.exports.circleText = (context, text, circle, startAngle, align, textHeight, inwardFacing, kerning) => {
    // declare and intialize canvas, reference, and useful variables
    context.setTransform(1, 0, 0, 1, 0, 0);
    align = align.toLowerCase();
    var clockwise = align == "right" ? 1 : -1; // draw clockwise for aligned right. Else Anticlockwise
    startAngle = startAngle * (Math.PI / 180); // convert to radians
    
    // Reverse letters for align Left inward, align right outward 
    // and align center inward.
    if (((["left", "center"].indexOf(align) > -1) && inwardFacing) || (align == "right" && !inwardFacing)) text = text.split("").reverse().join(""); 
    
    // Setup letters and positioning
    context.translate(circle.r + circle.x, circle.r + circle.y); // Move to center
    startAngle += (Math.PI * !inwardFacing); // Rotate 180 if outward
    context.textBaseline = 'middle'; // Ensure we draw in exact center
    context.textAlign = 'center'; // Ensure we draw in exact center

    // rotate 50% of total angle for center alignment
    if (align == "center") {
        for (var j = 0; j < text.length; j++) {
            var charWid = context.measureText(text[j]).width;
            startAngle += ((charWid + (j == text.length - 1 ? 0 : kerning)) / (circle.r - textHeight)) / 2 * -clockwise;
        }
    }

    // Phew... now rotate into final start position
    context.rotate(startAngle);

    // Now for the fun bit: draw, rotate, and repeat
    for (var j = 0; j < text.length; j++) {
        var charWid = context.measureText(text[j]).width; // half letter
        // rotate half letter
        context.rotate((charWid/2) / (circle.r - textHeight) * clockwise); 
        // draw the character at "top" or "bottom" 
        // depending on inward or outward facing
        context.fillText(text[j], 0, (inwardFacing ? 1 : -1) * (0 - circle.r + textHeight / 2));
        context.rotate((charWid / 2 + kerning) / (circle.r - textHeight) * clockwise); // rotate half letter
    }

};