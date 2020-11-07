// needed just for parcel to work
import 'regenerator-runtime/runtime'

// import sentinelhub-js things
// docs at https://github.com/sentinel-hub/sentinelhub-js
import {
  setAuthToken,
  requestAuthToken,
  isAuthTokenSet,
  S2L2ALayer,
  CRS_EPSG4326,
  BBox,
  MimeTypes,
  ApiType,
} from '@sentinel-hub/sentinelhub-js';

// first, create a Sentinel Hub account at https://services.sentinel-hub.com/oauth/subscription
// create an OAuth client as described at https://docs.sentinel-hub.com/api/latest/api/overview/authentication/
const CLIENT_ID = 'SET_CLIENT_ID';
const CLIENT_SECRET = 'SET_CLIENT_SECRET';

// create configuration instance and layer at https://apps.sentinel-hub.com/dashboard/#/configurations
// help for that available at https://www.sentinel-hub.com/develop/dashboard/
const INSTANCE_ID = 'SET_INSTANCE_ID';
const S2L2A_LAYER_ID = 'SET_LAYER_ID';

// create a bounding box (bbox) of the area of interest
// CRS (coordinate reference system): https://en.wikipedia.org/wiki/Spatial_reference_system
// most commonly used CRSs are:
// EPSG:3857, more at https://epsg.io/3857
// EPSG:4326, more at https://epsg.io/4326
const BBOX4326 = new BBox(CRS_EPSG4326, 11.9, 42.05, 12.95, 43.09);

// Processing API requires OAuth authentication token
async function setAuthTokenWithAuthCredentials() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Please set OAuth Client's id and secret for Processing API (CLIENT_ID, CLIENT_SECRET)",
    );
  }
  if (isAuthTokenSet()) {
    console.log('Auth token is already set.');
    return;
  }
  const authToken = await requestAuthToken(CLIENT_ID, CLIENT_SECRET);
  setAuthToken(authToken);
  console.log('Auth token retrieved and set successfully');
}

async function getImageInstanceLayer(){
  // https://github.com/sentinel-hub/sentinelhub-js#layers
  // define the layer to get the data from it
  const layerS2L2A = new S2L2ALayer({ instanceId: INSTANCE_ID, layerId: S2L2A_LAYER_ID });

  // https://github.com/sentinel-hub/sentinelhub-js#fetching-images
  // before fetching images, the parameters need to be defined
  const getMapParams = {
    bbox: BBOX4326,
    fromTime: new Date(Date.UTC(2019, 6 - 1, 1, 0, 0, 0)),
    toTime: new Date(Date.UTC(2019, 6 - 1, 30, 23, 59, 59)),
    width: 512,
    height: 512,
    format: MimeTypes.JPEG,
  };

  const imageBlob = await layerS2L2A.getMap(getMapParams, ApiType.PROCESSING);
  
  const img = document.createElement('img');
  img.width = '512';
  img.height = '512';
  img.src = URL.createObjectURL(imageBlob);
  const imgContainer = document.getElementById('imgContainer');
  imgContainer.appendChild(img);
}

async function getImageEvalscript() {
  // https://github.com/sentinel-hub/sentinelhub-js#layers
  // define the layer to get the data from it
  const layerS2L2A = new S2L2ALayer({ evalscript: `
//VERSION=3
function setup() {
  return {
    input: ["B04","B03","B02", "dataMask"],
    output: { bands: 4 }
  };
}

function evaluatePixel(sample) {
  return [2.5 * sample.B04,2.5 * sample.B03,2.5 * sample.B02, sample.dataMask ];
}`
  });

  // https://github.com/sentinel-hub/sentinelhub-js#fetching-images
  // before fetching images, the parameters need to be defined
  const getMapParams = {
    bbox: BBOX4326,
    fromTime: new Date(Date.UTC(2019, 6 - 1, 1, 0, 0, 0)),
    toTime: new Date(Date.UTC(2019, 6 - 1, 30, 23, 59, 59)),
    width: 512,
    height: 512,
    format: MimeTypes.JPEG,
  };

  const imageBlob = await layerS2L2A.getMap(getMapParams, ApiType.PROCESSING);

  const img = document.createElement('img');
  img.width = '512';
  img.height = '512';
  img.src = URL.createObjectURL(imageBlob);
  const imgContainer = document.getElementById('imgContainer');
  imgContainer.appendChild(img);
}

async function useSentinelhubJs () {
  await setAuthTokenWithAuthCredentials();
  await getImageInstanceLayer();
  await getImageEvalscript();
}

window.onload = function () {
  useSentinelhubJs();
};
