(function (window) {
  'use strict';

  // Global variables
  let ctx,
    jcp = new jCanvasPainter(),
    frameRate = 30, // frames per second
    filters = [
      'pixelate',
      'pointilate',
      'grayscale',
      'gameboy',
      'lowresscreen',
    ],
    currentFilterIndex = 0;
  // Global variables

  // Global functions
  /**
   * To change filter index, 1: forward, -1:backward
   * @param {number} increment 
   */
  function setFilterIndex(increment) {
    if (increment > 0) {
      if (currentFilterIndex < filters.length - 1) {
        currentFilterIndex++;
      } else {
        currentFilterIndex = 0;
      }
    } else {
      if (currentFilterIndex > 0) {
        currentFilterIndex--;
      }
      else {
        currentFilterIndex = filters.length - 1;
      }
    }

    let settingsPane;

    for (let i = 0; i < filters.length; i++) {
      settingsPane = document.getElementById('settings-' + filters[i]);

      if (settingsPane) {
        if (filters[i] === filters[currentFilterIndex]) {
          settingsPane.hidden = false;
        } else {
          settingsPane.hidden = true;
        }
      }
    }
  }

  // Window variables
  window.filters = filters;
  window.setFilterIndex = setFilterIndex;

  // Pixelate effect variables
  window.blockSize = 5;
  window.spaceBetweenBlocks = 0;

  // Pointilate effect variables
  window.pointSize = 5;
  window.spaceBetweenPoints = 0;

  // Lowresscreen effect variables
  window.brightness = 0;
  window.pixelSize = 5;
  window.spaceBetweenPixels = 0;
  window.selectedColorPalette = 0;
  // Window variables

  /**
   * To initialize video source, after initialization you can start getting image frames
   * @param {function} sourceInitialized 
   */
  function initSource(sourceInitialized) {
    let video = window.document.getElementById('video'),
      playPauseButton = window.document.getElementById('play-pause-button'),
      videoIsPlaying = false;

    playPauseButton.addEventListener('click', function () {
      if (videoIsPlaying) {
        video.pause();
      } else {
        video.play();
      }
      videoIsPlaying = !videoIsPlaying;
    });

    if (window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia) {
      window.navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {

        // some browsers uses srcObject so let#s try it first in case of error
        // we will use the old approach
        try {
          video.srcObject = stream;
        } catch (error) {
          video.src = window.URL.createObjectURL(stream);
        }

        video.play();
        videoIsPlaying = true;

        // set timeout at least 500 ms to make sure everything is ready
        setTimeout(function () {
          sourceInitialized(video);
        }, 500);
      });
    }
  }

  function initEffectCanvas(video) {
    jcp.setSource(video, video.videoWidth, video.videoHeight);

    window.setInterval(function () {
      switch (filters[currentFilterIndex]) {
        case 'pixelate':
          jcp.filters.pixelate('canvas', window.blockSize, window.spaceBetweenBlocks);
          break;
        case 'pointilate':
          jcp.filters.pointilate('canvas', window.pointSize, window.spaceBetweenPoints);
          break;
        case 'lowresscreen':
          jcp.filters.lowresscreen('canvas', window.brightness, window.pixelSize, window.spaceBetweenPixels, window.selectedColorPalette);
          break;
        default:
          jcp.filters[filters[currentFilterIndex]]('canvas');
          break;
      }
    }, 1000 / frameRate);
  }

  initSource(initEffectCanvas);

  document.addEventListener('DOMContentLoaded', function (event) {
    document.getElementById('filters-desc').innerHTML = filters.join(', ').toLocaleUpperCase();

    document.onkeydown = checkKey;

    function checkKey(e) {
      e = e || window.event;

      if (e.keyCode == '37') {
        // left arrow
        setFilterIndex(-1);
      }
      else if (e.keyCode == '39') {
        // right arrow
        setFilterIndex(1);
      }
    }
  });
})(window);
