/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */

var webRtcPeer;

const I_CAN_START = 0;
const I_CAN_STOP = 1;
const I_AM_STARTING = 2;

window.onload = function() {
  console = new Console();

  console.log("Page loaded...");

  var videoInput = document.getElementById('videoInput');
  var videoOutput = document.getElementById('videoOutput');

  var btnStart = document.getElementById('btnStart');
  var btnStop = document.getElementById('btnStop');

  function onRequest(request)
  {
    switch(request.method)
    {
      case 'startResponse':
        startResponse(request.params);
      break;

      case 'CrowdDetectorDirection':
        crowdDetectorDirection(request.params);
      break;

      case 'CrowdDetectorFluidity':
        crowdDetectorFluidity(request.params);
      break;

      case 'CrowdDetectorOccupancy':
        crowdDetectorOccupancy(request.params);
      break;

      case 'candidate':
        webRtcPeer.addIceCandidate(request.params[0])
      break;

      default:
        console.error(request)
    }
  }

	btnStart.addEventListener('click', function()
  {
    console.log("Starting video call...")

    const packer = RpcBuilder.packers.JsonRPC;

    rpcBuilder = new RpcBuilder(packer, new WebSocket('ws:'+location.host),
      onRequest);

    // Disable start button
    setState(I_AM_STARTING);
    showSpinner(videoInput, videoOutput);

    console.log("Creating WebRtcPeer and generating local sdp offer...");

    var options =
    {
      localVideo: videoInput,
      remoteVideo: videoOutput
    }

    webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error)
    {
      if(error) return onError(error)

      this.generateOffer(onOffer)
    });

    webRtcPeer.on('icecandidate', function(candidate) {
      rpcBuilder.encode('candidate', [candidate])
    });
  })

	btnStop.addEventListener('click', function(){
    console.log("Stopping video call...");
    setState(I_CAN_START);

    if (webRtcPeer) {
      webRtcPeer.dispose();
      webRtcPeer = null;

      rpcBuilder.encode('stop');
    }
    hideSpinner(videoInput, videoOutput);
  })

	function onOffer(error, offerSdp) {
    if(error) return onError(error)

    console.info('Invoking SDP offer callback function ' + location.host);

    rpcBuilder.encode('start', [offerSdp], processAnswer);
  }

	function processAnswer(error, sdpAnswer) {
    if(error) return onError(error)

    setState(I_CAN_STOP);

    console.log("SDP answer received from server. Processing...");
    webRtcPeer.processAnswer(sdpAnswer);
  }

  setState(I_CAN_START);
}


function crowdDetectorDirection(data)
{
  console.log ("Direction event received in roi " + data.roiID +
   " with direction " + data.directionAngle);
}

function crowdDetectorFluidity(data)
{
  console.log ("Fluidity event received in roi " + data.roiID +
   ". Fluidity level " + data.fluidityPercentage +
   " and fluidity percentage " + data.fluidityLevel);
}

function crowdDetectorOccupancy(data)
{
  console.log ("Occupancy event received in roi " + data.roiID +
   ". Occupancy level " + data.occupancyPercentage +
   " and occupancy percentage " + data.occupancyLevel);
}


function onError(error)
{
  if(error) console.error(error);
}

function setState(nextState) {
  switch (nextState) {
    case I_CAN_START:
      $('#start').attr('disabled', false);
      $('#stop').attr('disabled', true);
    break;

    case I_CAN_STOP:
      $('#start').attr('disabled', true);
      $('#stop').attr('disabled', false);
    break;

    case I_AM_STARTING:
      $('#start').attr('disabled', true);
      $('#stop').attr('disabled', true);
    break;

    default:
      onError("Unknown state " + nextState);
  }
}

function showSpinner() {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i].poster = './img/transparent-1px.png';
    arguments[i].style.background = "center transparent url('./img/spinner.gif') no-repeat";
  }
}

function hideSpinner() {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i].src = '';
    arguments[i].poster = './img/webrtc.png';
    arguments[i].style.background = '';
  }
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
  event.preventDefault();
  $(this).ekkoLightbox();
});
