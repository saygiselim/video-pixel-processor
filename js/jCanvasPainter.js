let jCanvasPainter = function () {
  let _canvas = document.createElement("canvas"), // Buffer Canvas
    _ctx = _canvas.getContext("2d"), // Buffer Canvas Context
    _src = null, // Image Source
    _width = 0, // Source Image Width
    _height = 0, // Source Image Height
    _filters = {}; // Image Processing Filters

  /**
   * RGB Model
   * 
   * @param {number} r 
   * @param {number} g 
   * @param {number} b 
   */
  function rgb(r, g, b) {
    return { r: r, g: g, b: b };
  }

  /**
   * Image source setter. Source can be image or video.
   * 
   * @param {*} source 
   * @param {number} width 
   * @param {number} height 
   */
  function setSource(source, width, height) {
    _src = typeof source === "string" ? document.getElementById(source) : source;
    _width = width;
    _height = height;
  }

  /**
   * Get one pixel from canvas context
   * 
   * @param {number} x
   * @param {number} y
   */
  function getPixel(x, y) {
    let pixel = _ctx.getImageData(x, y, 1, 1);
    return rgb(pixel.data[0], pixel.data[1], pixel.data[2]);
  }

  /**
   * Get average pixel from canvas context
   * 
   * @param {number} startX
   * @param {number} endX
   * @param {number} startY
   * @param {number} endY
   */
  function getPixelAverage(startX, endX, startY, endY) {
    let sumR = 0, sumG = 0, sumB = 0, pixelCount = 0, imagePart = _ctx.getImageData(startX, startY, endX - startX, endY - startY);

    for (let i = 0; i < imagePart.data.length; i += 4) {
      sumR += imagePart.data[i];    //Red
      sumG += imagePart.data[i + 1];//Green
      sumB += imagePart.data[i + 2];//Blue

      pixelCount++;
    }

    let averageR = Math.round(sumR / pixelCount);
    let averageG = Math.round(sumG / pixelCount);
    let averageB = Math.round(sumB / pixelCount);

    return rgb(averageR, averageG, averageB);
  }

  /**
   * It calculates distance between two colors
   * 
   * @param {number} r1 
   * @param {number} g1 
   * @param {number} b1 
   * @param {number} r2 
   * @param {number} g2 
   * @param {number} b2 
   */
  function dist(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt((r2 - r1) * (r2 - r1) + (g2 - g1) * (g2 - g1) + (b2 - b1) * (b2 - b1));
  }

  /**
   * It determines nearest color for the color given by rgb values
   * 
   * @param {rgb[]} colorPalette 
   * @param {number} r 
   * @param {number} g 
   * @param {number} b 
   */
  function nearestColor(colorPalette, r, g, b) {
    let closestDist = 5000, color = { r: r, g: g, b: b }, i, pc, d;

    for (i = 0; i < colorPalette.length; i++) {
      pc = colorPalette[i];
      d = dist(pc.r, pc.g, pc.b, r, g, b);

      if (d < closestDist) {
        closestDist = d;
        color = pc;
      }
    }

    return color;
  }

  _filters.pixelate = function (canvas, pixelSize, spaceBetweenPixels) {
    // draw image from source before process;
    _ctx.drawImage(_src, 0, 0, _width, _height, 0, 0, _canvas.width, _canvas.height);

    let cnvs = typeof canvas === "string" ? document.getElementById(canvas) : canvas;
    let ctx = cnvs.getContext("2d");

    //clear frame
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, _canvas.width, _canvas.height);

    for (let y = pixelSize; y <= _canvas.height; y += pixelSize)
      for (let x = pixelSize; x <= _canvas.width; x += pixelSize) {
        let pixel = getPixelAverage(x - pixelSize, x, y - pixelSize, y), actualPixelSize = pixelSize - spaceBetweenPixels;

        ctx.fillStyle = "rgb(" + pixel.r + "," + pixel.g + "," + pixel.b + ")";
        ctx.fillRect(x - pixelSize, y - pixelSize, actualPixelSize, actualPixelSize);
      }
  };

  _filters.pointilate = function (canvas, pixelSize, spaceBetweenPixels) {
    // draw image from source before process;
    _ctx.drawImage(_src, 0, 0, _width, _height, 0, 0, _canvas.width, _canvas.height);

    let cnvs = typeof canvas === "string" ? document.getElementById(canvas) : canvas;
    let ctx = cnvs.getContext("2d");

    //clear frame
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, _canvas.width, _canvas.height);

    for (y = pixelSize; y <= _canvas.height; y += pixelSize)
      for (x = pixelSize; x <= _canvas.width; x += pixelSize) {
        let pixel = getPixelAverage(x - pixelSize, x, y - pixelSize, y), actualPixelSize = pixelSize - spaceBetweenPixels;
        ctx.beginPath();
        ctx.fillStyle = "rgb(" + pixel.r + "," + pixel.g + "," + pixel.b + ")";
        ctx.arc(x - pixelSize, y - pixelSize, actualPixelSize / 2, 0, 2 * Math.PI);
        ctx.fill();
      }
  };

  _filters.grayscale = function (canvas) {
    // draw image from source before process;
    _ctx.drawImage(_src, 0, 0, _width, _height, 0, 0, _canvas.width, _canvas.height);

    let cnvs = typeof canvas === "string" ? document.getElementById(canvas) : canvas;
    let ctx = cnvs.getContext("2d");

    let imageData = _ctx.getImageData(0, 0, _width, _height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      let r = imageData.data[i];
      let g = imageData.data[i + 1];
      let b = imageData.data[i + 2];

      //luma grayscale
      let luma = r * 0.2126 + g * 0.7152 + b * 0.0722;

      imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = luma;
    }

    // overwrite original image data
    ctx.putImageData(imageData, 0, 0);
  }

  _filters.gameboy = function (canvas) {
    let colorPalette = [
      rgb(15, 56, 15),   // Darkest Green
      rgb(48, 98, 48),   // Dark Green
      rgb(139, 172, 15), // Light Green
      rgb(155, 188, 15)  //Lightest Green
    ];

    // draw image from source before process;
    _ctx.drawImage(_src, 0, 0, _width, _height, 0, 0, _canvas.width, _canvas.height);

    let cnvs = typeof canvas === "string" ? document.getElementById(canvas) : canvas;
    let ctx = cnvs.getContext("2d");

    let imageData = _ctx.getImageData(0, 0, _width, _height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      let r = imageData.data[i];
      let g = imageData.data[i + 1];
      let b = imageData.data[i + 2];

      let nc = nearestColor(colorPalette, r, g, b);

      imageData.data[i] = nc.r;
      imageData.data[i + 1] = nc.g;
      imageData.data[i + 2] = nc.b;
    }

    // overwrite original image data
    ctx.putImageData(imageData, 0, 0);
  }

  _filters.lowresscreen = function (canvas, brightness, pixelSize, spaceBetweenPixels, selectedColorPalette) {
    let teletextColorPalette = [
      rgb(255, 0, 0),     // Red
      rgb(255, 255, 0),   // Yellow
      rgb(0, 255, 255),   // Cyan
      rgb(0, 0, 255),     // Blue
      rgb(255, 0, 255),   // Magenta
    ],
      gameboyColorPalette = [
        rgb(15, 56, 15),   // Darkest Green
        rgb(48, 98, 48),   // Dark Green
        rgb(139, 172, 15), // Light Green
        rgb(155, 188, 15)  //Lightest Green
      ],
      bwColorPalette = [
        rgb(0, 0, 0),      //Black
        rgb(255, 255, 255) //White
      ],
      vanGoghColorPalette = [
        //Yellow variants
        rgb(239, 232, 141),
        rgb(253, 235, 89),
        rgb(255, 255, 97),
        rgb(254, 191, 8),

        //Red variants
        rgb(227, 68, 49),
        rgb(213, 41, 39),
        rgb(202, 49, 56),

        //Blue variants
        rgb(0, 60, 177),
        rgb(58, 64, 100),
        rgb(44, 88, 165),
        rgb(96, 181, 209),

        //Green variants
        rgb(1, 153, 102),
        rgb(29, 125, 35),

        //Black & White
        rgb(0, 0, 0),
        rgb(255, 255, 255)
      ],
      materialColorPalette = [
        rgb(244, 67, 54),   //RED
        rgb(233, 30, 99),   //PINK
        rgb(156, 39, 176),  //PURPLE
        rgb(103, 58, 183),  //DEEP PURPLE
        rgb(63, 81, 181),   //INDIGO
        rgb(33, 150, 243),  //BLUE
        rgb(3, 169, 244),   //LIGHT BLUE
        rgb(0, 188, 212),   //CYAN
        rgb(0, 150, 136),   //TEAL
        rgb(76, 175, 80),   //GREEN
        rgb(139, 195, 74),  //LIGHT GREEN
        rgb(205, 220, 57),  //LIME
        rgb(255, 235, 59),  //YELLOW
        rgb(255, 193, 7),   //AMBER
        rgb(255, 152, 0),   //ORANGE
        rgb(255, 87, 34),   //DEEP ORANGE
        rgb(121, 85, 72),   //BROWN
        rgb(96, 125, 139),  //BLUE GREY
        rgb(125, 125, 125), //GREY
        rgb(30, 30, 30),    //BLACK
        rgb(225, 225, 225), //WHITE

        //SKIN COLORS
        // rgb(246, 217, 203), //LIGHT CAUCASIAN
        // rgb(239, 192, 164), //CAUCASIAN
        // rgb(214, 141, 106), //DARK CAUCASIAN
        // rgb(237, 184, 134), //ASIAN
        // rgb(201, 133, 88), //LIGHT BLACK
        // rgb(91, 60, 40) //DARK BLACK
      ];

    let actualPixelSize = pixelSize - spaceBetweenPixels, colorPalettes = [teletextColorPalette, gameboyColorPalette, bwColorPalette, vanGoghColorPalette, materialColorPalette];

    // draw image from source before process;
    _ctx.drawImage(_src, 0, 0, _width, _height, 0, 0, _canvas.width, _canvas.height);

    let cnvs = typeof canvas === "string" ? document.getElementById(canvas) : canvas;
    let ctx = cnvs.getContext("2d");

    //clear frame
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, _canvas.width, _canvas.height);

    for (let y = pixelSize; y <= _canvas.height; y += pixelSize)
      for (let x = pixelSize; x <= _canvas.width; x += pixelSize) {
        let pixel = getPixelAverage(x - pixelSize, x, y - pixelSize, y);
        let nc = nearestColor(colorPalettes[selectedColorPalette], pixel.r + brightness, pixel.g + brightness, pixel.b + brightness);

        ctx.fillStyle = "rgb(" + nc.r + "," + nc.g + "," + nc.b + ")";
        ctx.fillRect(x - pixelSize, y - pixelSize, actualPixelSize, actualPixelSize);
      }
  }

  //declare functions
  this.setSource = setSource;
  this.filters = _filters;
}
