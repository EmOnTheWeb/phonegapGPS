(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var MapboxClient = require('mapbox');
var client = new MapboxClient('pk.eyJ1IjoiZW1pbGllZGFubmVuYmVyZyIsImEiOiJjaXhmOTB6ZnowMDAwMnVzaDVkcnpsY2M1In0.33yDwUq670jHD8flKjzqxg');
client.geocodeForward('Chester, NJ', function(err, res) {
  // res is the geocoding result as parsed JSON
  console.log(res); 
});

},{"mapbox":9}],2:[function(require,module,exports){
'use strict';

if (typeof Promise === 'undefined') {
  // install ES6 Promise polyfill
  require('../vendor/promise');
}

var interceptor = require('rest/interceptor');

var callbackify = interceptor({
  success: function (response) {
    var callback = response && response.callback;

    if (typeof callback === 'function') {
      callback(null, response.entity, response);
    }

    return response;
  },
  error: function (response) {
    var callback = response && response.callback;

    if (typeof callback === 'function') {
      var err = response.error || response.entity;
      if (typeof err !== 'object') err = new Error(err);
      callback(err);
    }

    return response;
  }
});

module.exports = callbackify;

},{"../vendor/promise":21,"rest/interceptor":28}],3:[function(require,module,exports){
'use strict';

if (typeof Promise === 'undefined') {
  // install ES6 Promise polyfill
  require('../vendor/promise');
}

var rest = require('rest');
var standardResponse = require('./standard_response');
var callbackify = require('./callbackify');

// rest.js client with MIME support
module.exports = function(config) {
  return rest
    .wrap(require('rest/interceptor/errorCode'))
    .wrap(require('rest/interceptor/pathPrefix'), { prefix: config.endpoint })
    .wrap(require('rest/interceptor/mime'), { mime: 'application/json' })
    .wrap(require('rest/interceptor/params'))
    .wrap(require('rest/interceptor/defaultRequest'), {
      params: { access_token: config.accessToken }
    })
    .wrap(require('rest/interceptor/template'))
    .wrap(standardResponse)
    .wrap(callbackify);
};

},{"../vendor/promise":21,"./callbackify":2,"./standard_response":18,"rest":24,"rest/interceptor/defaultRequest":29,"rest/interceptor/errorCode":30,"rest/interceptor/mime":31,"rest/interceptor/params":32,"rest/interceptor/pathPrefix":33,"rest/interceptor/template":34}],4:[function(require,module,exports){
// We keep all of the constants that declare endpoints in one
// place, so that we could conceivably update this for API layout
// revisions.
module.exports.DEFAULT_ENDPOINT = 'https://api.mapbox.com';

module.exports.API_GEOCODING_FORWARD = '/geocoding/v5/{dataset}/{query}.json{?proximity,country,types,bbox,limit}';
module.exports.API_GEOCODING_REVERSE = '/geocoding/v5/{dataset}/{longitude},{latitude}.json{?types,limit}';

module.exports.API_DIRECTIONS = '/v4/directions/{profile}/{encodedWaypoints}.json{?alternatives,instructions,geometry,steps}';
module.exports.API_DISTANCE = '/distances/v1/mapbox/{profile}';

module.exports.API_SURFACE = '/v4/surface/{mapid}.json{?layer,fields,points,geojson,interpolate,encoded_polyline}';

module.exports.API_UPLOADS = '/uploads/v1/{owner}';
module.exports.API_UPLOAD = '/uploads/v1/{owner}/{upload}';
module.exports.API_UPLOAD_CREDENTIALS = '/uploads/v1/{owner}/credentials';

module.exports.API_MATCHING = '/matching/v4/{profile}.json';

module.exports.API_DATASET_DATASETS = '/datasets/v1/{owner}{?limit,start,fresh}';
module.exports.API_DATASET_DATASET = '/datasets/v1/{owner}/{dataset}';
module.exports.API_DATASET_FEATURES = '/datasets/v1/{owner}/{dataset}/features{?reverse,limit,start}';
module.exports.API_DATASET_FEATURE = '/datasets/v1/{owner}/{dataset}/features/{id}';

module.exports.API_TILESTATS_STATISTICS = '/tilestats/v1/{owner}/{tileset}';
module.exports.API_TILESTATS_LAYER = '/tilestats/v1/{owner}/{tileset}/{layer}';
module.exports.API_TILESTATS_ATTRIBUTE = '/tilestats/v1/{owner}/{tileset}/{layer}/{attribute}';

module.exports.API_STATIC = '/v4/{mapid}{+overlay}/{+xyz}/{width}x{height}{+retina}{.format}{?access_token}';

module.exports.API_STYLES_LIST = '/styles/v1/{owner}';
module.exports.API_STYLES_CREATE = '/styles/v1/{owner}';
module.exports.API_STYLES_READ = '/styles/v1/{owner}/{styleid}';
module.exports.API_STYLES_UPDATE = '/styles/v1/{owner}/{styleid}';
module.exports.API_STYLES_DELETE = '/styles/v1/{owner}/{styleid}';
module.exports.API_STYLES_EMBED = '/styles/v1/{owner}/{styleid}.html{?zoomwheel,title,access_token}';
module.exports.API_STYLES_SPRITE = '/styles/v1/{owner}/{styleid}/sprite{+retina}{.format}';
module.exports.API_STYLES_SPRITE_ADD_ICON = '/styles/v1/{owner}/{styleid}/sprite/{iconName}';
module.exports.API_STYLES_SPRITE_DELETE_ICON = '/styles/v1/{owner}/{styleid}/sprite/{iconName}';

module.exports.API_STYLES_FONT_GLYPH_RANGES = '/fonts/v1/{owner}/{font}/{start}-{end}.pbf'

},{}],5:[function(require,module,exports){
'use strict';

var invariantLocation = require('./invariant_location');

/**
 * Format waypionts in a way that's friendly to the directions and surface
 * API: comma-separated latitude, longitude pairs with semicolons between
 * them.
 * @private
 * @param {Array<Object>} waypoints array of objects with latitude and longitude
 * properties
 * @returns {string} formatted points
 * @throws {Error} if the input is invalid
 */
function formatPoints(waypoints) {
  return waypoints.map(function(location) {
    invariantLocation(location);
    return location.longitude + ',' + location.latitude;
  }).join(';');
}

module.exports = formatPoints;

},{"./invariant_location":7}],6:[function(require,module,exports){
'use strict';

var b64 = require('rest/util/base64');

/**
 * Access tokens actually are data, and using them we can derive
 * a user's username. This method attempts to do just that,
 * decoding the part of the token after the first `.` into
 * a username.
 *
 * @private
 * @param {string} token an access token
 * @return {string} username
 */
function getUser(token) {
  var data = token.split('.')[1];
  if (!data) return null;
  data = data.replace(/-/g, '+').replace(/_/g, '/');

  var mod = data.length % 4;
  if (mod === 2) data += '==';
  if (mod === 3) data += '=';
  if (mod === 1 || mod > 3) return null;

  try {
    return JSON.parse(b64.decode(data)).u;
  } catch(err) {
    return null;
  }
}

module.exports = getUser;

},{"rest/util/base64":43}],7:[function(require,module,exports){
'use strict';

var invariant = require('../vendor/invariant');

/**
 * Given an object that should be a location, ensure that it has
 * valid numeric longitude & latitude properties
 *
 * @param {Object} location object with longitude and latitude values
 * @throws {AssertError} if the object is not a valid location
 * @returns {undefined} nothing
 * @private
 */
function invariantLocation(location) {
  invariant(typeof location.latitude === 'number' &&
    typeof location.longitude === 'number',
    'location must be an object with numeric latitude & longitude properties');
  if (location.zoom !== undefined) {
    invariant(typeof location.zoom === 'number', 'zoom must be numeric');
  }
}

module.exports = invariantLocation;

},{"../vendor/invariant":20}],8:[function(require,module,exports){
'use strict';

var invariant = require('../vendor/invariant');
var constants = require('./constants');
var client = require('./client');
var getUser = require('./get_user');

/**
 * Services all have the same constructor pattern: you initialize them
 * with an access token and options, and they validate those arguments
 * in a predictable way. This is a constructor-generator that makes
 * it possible to require each service's API individually.
 *
 * @private
 * @param {string} name the name of the Mapbox API this class will access:
 * this is set to the name of the function so it will show up in tracebacks
 * @returns {Function} constructor function
 */
function makeService(name) {

  function service(accessToken, options) {
    this.name = name;

    invariant(typeof accessToken === 'string',
      'accessToken required to instantiate Mapbox client');

    var endpoint = constants.DEFAULT_ENDPOINT;

    if (options !== undefined) {
      invariant(typeof options === 'object', 'options must be an object');
      if (options.endpoint) {
        invariant(typeof options.endpoint === 'string', 'endpoint must be a string');
        endpoint = options.endpoint;
      }
      if (options.account) {
        invariant(typeof options.account === 'string', 'account must be a string');
        this.owner = options.account;
      }
    }

    this.client = client({
      endpoint: endpoint,
      accessToken: accessToken
    });

    this.accessToken = accessToken;
    this.endpoint = endpoint;
    this.owner = this.owner || getUser(accessToken);
    invariant(!!this.owner, 'could not determine account from provided accessToken');

  }

  return service;
}

module.exports = makeService;

},{"../vendor/invariant":20,"./client":3,"./constants":4,"./get_user":6}],9:[function(require,module,exports){
'use strict';

var makeClient = require('./make_service');
var xtend = require('../vendor/xtend').extendMutable;
var getUser = require('./get_user');
var MapboxGeocoding = require('./services/geocoding');
var MapboxSurface = require('./services/surface');
var MapboxDirections = require('./services/directions');
var MapboxUploads = require('./services/uploads');
var MapboxMatching = require('./services/matching');
var MapboxDatasets = require('./services/datasets');
var MapboxDistance = require('./services/distance');
var MapboxTilestats = require('./services/tilestats');


/**
 * The JavaScript API to Mapbox services
 *
 * @class
 * @throws {Error} if accessToken is not provided
 * @param {string} accessToken a private or public access token
 * @param {Object} options additional options provided for configuration
 * @param {string} [options.endpoint=https://api.mapbox.com] location
 * of the Mapbox API pointed-to. This can be customized to point to a
 * Mapbox Atlas Server instance, or a different service, a mock,
 * or a staging endpoint. Usually you don't need to customize this.
 * @param {string} [options.account] account id to use for api
 * requests. If not is specified, the account defaults to the owner
 * of the provided accessToken.
 * @example
 * var client = new MapboxClient('ACCESSTOKEN');
 */
var MapboxClient = makeClient('MapboxClient');

// Combine all client APIs into one API for when people require()
// the main mapbox-sdk-js library.
xtend(
  MapboxClient.prototype,
  MapboxGeocoding.prototype,
  MapboxSurface.prototype,
  MapboxDirections.prototype,
  MapboxDistance.prototype,
  MapboxMatching.prototype,
  MapboxDatasets.prototype,
  MapboxUploads.prototype,
  MapboxTilestats.prototype
);

MapboxClient.getUser = getUser;

module.exports = MapboxClient;

},{"../vendor/xtend":22,"./get_user":6,"./make_service":8,"./services/datasets":10,"./services/directions":11,"./services/distance":12,"./services/geocoding":13,"./services/matching":14,"./services/surface":15,"./services/tilestats":16,"./services/uploads":17}],10:[function(require,module,exports){
'use strict';

var invariant = require('../../vendor/invariant'),
  hat = require('../../vendor/hat'),
  makeService = require('../make_service'),
  constants = require('../constants');

var Datasets = module.exports = makeService('MapboxDatasets');

/**
 * To retrieve a listing of datasets for a particular account.
 * This request requires an access token with the datasets:read scope.
 *
 * @param {Function} callback called with (err, datasets)
 * @returns {undefined} nothing, calls callback
 * @example
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * client.listDatasets(function(err, datasets) {
 *   console.log(datasets);
 *   // [
 *   //   {
 *   //     "owner": {account},
 *   //     "id": {dataset id},
 *   //     "name": {dataset name},
 *   //     "description": {dataset description},
 *   //     "created": {timestamp},
 *   //     "modified": {timestamp}
 *   //   },
 *   //   {
 *   //     "owner": {account},
 *   //     "id": {dataset id},
 *   //     "name": {dataset name},
 *   //     "description": {dataset description},
 *   //     "created": {timestamp},
 *   //     "modified": {timestamp}
 *   //   }
 *   // ]
 * });
 */
Datasets.prototype.listDatasets = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return this.client({
    path: constants.API_DATASET_DATASETS,
    params: {
      limit: opts.limit,
      start: opts.start,
      fresh: opts.fresh,
      owner: this.owner
    },
    callback: callback
  });
};

/**
 * To create a new dataset. Valid properties include title and description (not required).
 * This request requires an access token with the datasets:write scope.
 *
 * @param {object} [options] an object defining a dataset's properties
 * @param {string} [options.name] the dataset's name
 * @param {string} [options.description] the dataset's description
 * @param {Function} callback called with (err, dataset)
 * @returns {undefined} nothing, calls callback
 * @example
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * client.createDataset({ name: 'foo', description: 'bar' }, function(err, dataset) {
 *   console.log(dataset);
 *   // {
 *   //   "owner": {account},
 *   //   "id": {dataset id},
 *   //   "name": "foo",
 *   //   "description": "description",
 *   //   "created": {timestamp},
 *   //   "modified": {timestamp}
 *   // }
 * });
 */
Datasets.prototype.createDataset = function(options, callback) {
  // permit the options argument to be omitted
  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  }

  invariant(typeof options === 'object', 'options must be an object');

  return this.client({
    path: constants.API_DATASET_DATASETS,
    params: {
      owner: this.owner
    },
    entity: options,
    callback: callback
  });
};

/**
 * To retrieve information about a particular dataset.
 * This request requires an access token with the datasets:read scope.
 *
 * @param {string} dataset the id for an existing dataset
 * @param {Function} callback called with (err, dataset)
 * @returns {undefined} nothing, calls callback
 * @example
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * client.readDataset('dataset-id', function(err, dataset) {
 *   console.log(dataset);
 *   // {
 *   //   "owner": {account},
 *   //   "id": "dataset-id",
 *   //   "name": {dataset name},
 *   //   "description": {dataset description},
 *   //   "created": {timestamp},
 *   //   "modified": {timestamp}
 *   // }
 * });
 */
Datasets.prototype.readDataset = function(dataset, callback) {
  invariant(typeof dataset === 'string', 'dataset must be a string');

  return this.client({
    path: constants.API_DATASET_DATASET,
    params: {
      owner: this.owner,
      dataset: dataset
    },
    callback: callback
  });
};

/**
 * To make updates to a particular dataset's properties.
 * This request requires an access token with the datasets:write scope.
 *
 * @param {string} dataset the id for an existing dataset
 * @param {object} [options] an object defining updates to the dataset's properties
 * @param {string} [options.name] the updated dataset's name
 * @param {string} [options.description] the updated dataset's description
 * @param {Function} callback called with (err, dataset)
 * @returns {undefined} nothing, calls callback
 * @example
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * var options = { name: 'foo' };
 * client.updateDataset('dataset-id', options, function(err, dataset) {
 *   console.log(dataset);
 *   // {
 *   //   "owner": {account},
 *   //   "id": "dataset-id",
 *   //   "name": "foo",
 *   //   "description": {dataset description},
 *   //   "created": {timestamp},
 *   //   "modified": {timestamp}
 *   // }
 * });
 */
Datasets.prototype.updateDataset = function(dataset, options, callback) {
  invariant(typeof dataset === 'string', 'dataset must be a string');
  invariant(typeof options === 'object', 'options must be an object');
  invariant(!!options.name || !!options.description, 'options must include a name or a description');

  return this.client({
    path: constants.API_DATASET_DATASET,
    params: {
      owner: this.owner,
      dataset: dataset
    },
    method: 'patch',
    entity: options,
    callback: callback
  });
};

/**
 * To delete a particular dataset.
 * This request requires an access token with the datasets:write scope.
 *
 * @param {string} dataset the id for an existing dataset
 * @param {Function} callback called with (err)
 * @returns {undefined} nothing, calls callback
 * @example
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * client.deleteDataset('dataset-id', function(err) {
 *   if (!err) console.log('deleted!');
 * });
 */
Datasets.prototype.deleteDataset = function(dataset, callback) {
  invariant(typeof dataset === 'string', 'dataset must be a string');

  return this.client({
    path: constants.API_DATASET_DATASET,
    params: {
      owner: this.owner,
      dataset: dataset
    },
    method: 'delete',
    callback: callback
  });
};

/**
 * Retrive a list of the features in a particular dataset. The response body will be a GeoJSON FeatureCollection.
 * This request requires an access token with the datasets:read scope.
 *
 * @param {string} dataset the id for an existing dataset
 * @param {object} [options] an object for passing pagination arguments
 * @param {boolean} [options.reverse] Set to `true` to reverse the default sort order of the listing.
 * @param {number} [options.limit] The maximum number of objects to return. This value must be between 1 and 100. The API will attempt to return the requested number of objects, but receiving fewer objects does not necessarily signal the end of the collection. Receiving an empty page of results is the only way to determine when you are at the end of a collection.
 * @param {string} [options.start] The object id that acts as the cursor for pagination and defines your location in the collection. This argument is exclusive so the object associated with the id provided to the start argument will not be included in the response.
 * @param {Function} callback called with (err, collection)
 * @returns {undefined} nothing, calls callback
 * @example
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * client.listFeatures('dataset-id', options, function(err, collection) {
 *   console.log(collection);
 *   {
 *     "type": "FeatureCollection",
 *     "features": [
 *       {
 *         "id": {feature id},
 *         "type": "Feature",
 *         "properties": {feature properties}
 *         "geometry": {feature geometry}
 *       },
 *       {
 *         "id": {feature id},
 *         "type": "Feature",
 *         "properties": {feature properties}
 *         "geometry": {feature geometry}
 *       }
 *     ]
 *   }
 * });
 */
Datasets.prototype.listFeatures = function(dataset, options, callback) {
  // permit the options argument to be omitted
  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  }

  invariant(typeof dataset === 'string', 'dataset must be a string');
  invariant(typeof options === 'object', 'options must be a object');

  var params = {
    owner: this.owner,
    dataset: dataset
  };

  if (options.reverse) {
    invariant(typeof options.reverse === 'boolean', 'reverse option must be a boolean');
    params.reverse = options.reverse;
  }

  if (options.limit) {
    invariant(typeof options.limit === 'number', 'limit option must be a number');
    params.limit = options.limit;
  }

  if (options.start) {
    invariant(typeof options.start === 'string', 'start option must be a string');
    params.start = options.start;
  }

  return this.client({
    path: constants.API_DATASET_FEATURES,
    params: params,
    callback: callback
  });
};

/**
 * Insert a feature into a dataset. This can be a new feature, or overwrite an existing one.
 * If overwriting an existing feature, make sure that the feature's `id` property correctly identifies
 * the feature you wish to overwrite.
 * For new features, specifying an `id` is optional. If you do not specify an `id`, one will be assigned
 * and returned as part of the response.
 * This request requires an access token with the datasets:write scope.
 * There are a number of limits to consider when making this request:
 *   - a single feature cannot be larger than 500 KB
 *   - the dataset must not exceed 2000 total features
 *   - the dataset must not exceed a total of 5 MB
 *
 * @param {object} feature the feature to insert. Must be a valid GeoJSON feature per http://geojson.org/geojson-spec.html#feature-objects
 * @param {string} dataset the id for an existing dataset
 * @param {Function} callback called with (err, feature)
 * @returns {undefined} nothing, calls callback
 * @example
 * // Insert a brand new feature without an id
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * var feature = {
 *   "type": "Feature",
 *   "properties": {
 *     "name": "Null Island"
 *   },
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [0, 0]
 *   }
 * };
 * client.insertFeature(feature, 'dataset-id', function(err, feature) {
 *   console.log(feature);
 *   // {
 *   //   "id": {feature id},
 *   //   "type": "Feature",
 *   //   "properties": {
 *   //     "name": "Null Island"
 *   //   },
 *   //   "geometry": {
 *   //     "type": "Point",
 *   //     "coordinates": [0, 0]
 *   //   }
 *   // }
 * });
 * @example
 * // Insert a brand new feature with an id, or overwrite an existing feature at that id
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * var feature = {
 *   "id": "feature-id",
 *   "type": "Feature",
 *   "properties": {
 *     "name": "Null Island"
 *   },
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [0, 0]
 *   }
 * };
 * client.insertFeature(feature, 'dataset-id', function(err, feature) {
 *   console.log(feature);
 *   // {
 *   //   "id": "feature-id",
 *   //   "type": "Feature",
 *   //   "properties": {
 *   //     "name": "Null Island"
 *   //   },
 *   //   "geometry": {
 *   //     "type": "Point",
 *   //     "coordinates": [0, 0]
 *   //   }
 *   // }
 * });
 */
Datasets.prototype.insertFeature = function(feature, dataset, callback) {
  invariant(typeof dataset === 'string', 'dataset must be a string');

  var id = feature.id || hat();
  invariant(typeof id === 'string', 'The GeoJSON feature\'s id must be a string');

  return this.client({
    path: constants.API_DATASET_FEATURE,
    params: {
      owner: this.owner,
      dataset: dataset,
      id: id
    },
    method: 'put',
    entity: feature,
    callback: callback
  });
};

/**
 * Read an existing feature from a dataset.
 * This request requires an access token with the datasets:read scope.
 *
 * @param {string} id the `id` of the feature to read
 * @param {string} dataset the id for an existing dataset
 * @param {Function} callback called with (err, feature)
 * @returns {undefined} nothing, calls callback
 * @example
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * client.readFeature('feature-id', 'dataset-id', function(err, feature) {
 *   console.log(feature);
 *   // {
 *   //   "id": "feature-id",
 *   //   "type": "Feature",
 *   //   "properties": {
 *   //     "name": "Null Island"
 *   //   },
 *   //   "geometry": {
 *   //     "type": "Point",
 *   //     "coordinates": [0, 0]
 *   //   }
 *   // }
 * });
 */
Datasets.prototype.readFeature = function(id, dataset, callback) {
  invariant(typeof id === 'string', 'id must be a string');
  invariant(typeof dataset === 'string', 'dataset must be a string');

  return this.client({
    path: constants.API_DATASET_FEATURE,
    params: {
      owner: this.owner,
      dataset: dataset,
      id: id
    },
    callback: callback
  });
};

/**
 * Delete an existing feature from a dataset.
 * This request requires an access token with the datasets:write scope.
 *
 * @param {string} id the `id` of the feature to read
 * @param {string} dataset the id for an existing dataset
 * @param {Function} callback called with (err)
 * @returns {undefined} nothing, calls callback
 * @example
 * var MapboxClient = require('mapbox');
 * var client = new MapboxClient('ACCESSTOKEN');
 * client.deleteFeature('feature-id', 'dataset-id', function(err, feature) {
 *   if (!err) console.log('deleted!');
 * });
 */
Datasets.prototype.deleteFeature = function(id, dataset, callback) {
  invariant(typeof id === 'string', 'id must be a string');
  invariant(typeof dataset === 'string', 'dataset must be a string');

  return this.client({
    path: constants.API_DATASET_FEATURE,
    params: {
      owner: this.owner,
      dataset: dataset,
      id: id
    },
    method: 'delete',
    callback: callback
  })};


},{"../../vendor/hat":19,"../../vendor/invariant":20,"../constants":4,"../make_service":8}],11:[function(require,module,exports){
'use strict';

var invariant = require('../../vendor/invariant'),
  formatPoints = require('../format_points'),
  makeService = require('../make_service'),
  constants = require('../constants');

var MapboxDirections = makeService('MapboxDirections');

/**
 * Find directions from A to B, or between any number of locations.
 * Consult the [Mapbox Directions API](https://www.mapbox.com/developers/api/directions/)
 * for more documentation.
 *
 * @param {Array<Object>} waypoints an array of objects with `latitude`
 * and `longitude` properties that represent waypoints in order. Up to
 * 25 waypoints can be specified.
 * @param {Object} [options={}] additional options meant to tune
 * the request
 * @param {string} [options.profile=mapbox.driving] the directions
 * profile, which determines how to prioritize different routes.
 * Options are `'mapbox.driving'`, which assumes transportation via an
 * automobile and will use highways, `'mapbox.walking'`, which avoids
 * streets without sidewalks, and `'mapbox.cycling'`, which prefers streets
 * with bicycle lanes and lower speed limits for transportation via
 * bicycle.
 * @param {string} [options.alternatives=true] whether to generate
 * alternative routes along with the preferred route.
 * @param {string} [options.instructions=text] format for turn-by-turn
 * instructions along the route.
 * @param {string} [options.geometry=geojson] format for the returned
 * route. Options are `'geojson'`, `'polyline'`, or `false`: `polyline`
 * yields more compact responses which can be decoded on the client side.
 * [GeoJSON](http://geojson.org/), the default, is compatible with libraries
 * like [Mapbox GL](https://www.mapbox.com/mapbox-gl/),
 * Leaflet and [Mapbox.js](https://www.mapbox.com/mapbox.js/). `false`
 * omits the geometry entirely and only returns instructions.
 * @param {Function} callback called with (err, results)
 * @returns {undefined} nothing, calls callback
 * @memberof MapboxClient
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 * mapboxClient.getDirections(
 *   [
 *     { latitude: 33.6, longitude: -95.4431 },
 *     { latitude: 33.2, longitude: -95.4431 } ],
 *   function(err, res) {
 *   // res is a document with directions
 * });
 *
 * // With options
 * mapboxClient.getDirections([
 *   { latitude: 33.6875431, longitude: -95.4431142 },
 *   { latitude: 33.6875431, longitude: -95.4831142 }
 * ], {
 *   profile: 'mapbox.walking',
 *   instructions: 'html',
 *   alternatives: false,
 *   geometry: 'polyline'
 * }, function(err, results) {
 *   console.log(results.origin);
 * });
 */
MapboxDirections.prototype.getDirections = function(waypoints, options, callback) {

  // permit the options argument to be omitted
  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  } else if (options === undefined) {
    options = {};
  }

  // typecheck arguments
  invariant(Array.isArray(waypoints), 'waypoints must be an array');
  invariant(typeof options === 'object', 'options must be an object');

  var encodedWaypoints = formatPoints(waypoints);

  var profile = 'mapbox.driving',
    alternatives = true,
    steps = true,
    geometry = 'geojson',
    instructions = 'text';

  if (options.profile) {
    invariant(typeof options.profile === 'string', 'profile option must be string');
    profile = options.profile;
  }

  if (typeof options.alternatives !== 'undefined') {
    invariant(typeof options.alternatives === 'boolean', 'alternatives option must be boolean');
    alternatives = options.alternatives;
  }

  if (typeof options.steps !== 'undefined') {
    invariant(typeof options.steps === 'boolean', 'steps option must be boolean');
    steps = options.steps;
  }

  if (options.geometry) {
    invariant(typeof options.geometry === 'string', 'geometry option must be string');
    geometry = options.geometry;
  }

  if (options.instructions) {
    invariant(typeof options.instructions === 'string', 'instructions option must be string');
    instructions = options.instructions;
  }

  return this.client({
    path: constants.API_DIRECTIONS,
    params: {
      encodedWaypoints: encodedWaypoints,
      profile: profile,
      instructions: instructions,
      geometry: geometry,
      alternatives: alternatives,
      steps: steps
    },
    callback: callback
  });
};

module.exports = MapboxDirections;

},{"../../vendor/invariant":20,"../constants":4,"../format_points":5,"../make_service":8}],12:[function(require,module,exports){
'use strict';

var invariant = require('../../vendor/invariant'),
  makeService = require('../make_service'),
  constants = require('../constants');

var MapboxDistance = makeService('MapboxDistance');

/**
 * Compute a table of travel-time estimates between a set of waypoints.
 * Consult the [Mapbox Distance API](https://www.mapbox.com/developers/api/distance/)
 * for more documentation.
 *
 * @param {Array<Array<number>>} waypoints an array of coordinate pairs
 * in [longitude, latitude] order. Up to
 * 100 waypoints can be specified.
 * @param {Object} [options={}] additional options meant to tune
 * the request
 * @param {string} [options.profile=driving] the directions
 * profile, which determines how to prioritize different routes.
 * Options are `'driving'`, which assumes transportation via an
 * automobile and will use highways, `'walking'`, which avoids
 * streets without sidewalks, and `'cycling'`, which prefers streets
 * with bicycle lanes and lower speed limits for transportation via
 * bicycle.
 * @param {Function} callback called with (err, results)
 * @returns {undefined} nothing, calls callback
 * @memberof MapboxClient
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 * // With options
 * mapboxClient.getDistances([
 *   [-95.4431142, 33.6875431],
 *   [-95.0431142, 33.6875431],
 *   [-95.0431142, 33.0875431],
 *   [-95.0431142, 33.0175431],
 *   [-95.4831142, 33.6875431]
 * ], {
 *   profile: 'walking'
 * }, function(err, results) {
 *   console.log(results);
 * });
 *
 * // Results is an object like:
 * { durations:
 *   [ [ 0, 1196, 3977, 3415, 5196 ],
 *     [ 1207, 0, 3775, 3213, 4993 ],
 *     [ 3976, 3774, 0, 2650, 2579 ],
 *     [ 3415, 3212, 2650, 0, 3869 ],
 *     [ 5208, 5006, 2579, 3882, 0 ] ] }
 *
 * // If the coordinates include an un-routable place, then
 * // the table may contain 'null' values to indicate this, like
 * { durations:
 *   [ [ 0, 11642, 57965, null, 72782 ],
 *     [ 11642, 0, 56394, null, 69918 ],
 *     [ 57965, 56394, 0, null, 19284 ],
 *     [ null, null, null, 0, null ],
 *     [ 72782, 69918, 19284, null, 0 ] ] }
 */
MapboxDistance.prototype.getDistances = function(waypoints, options, callback) {

  // permit the options argument to be omitted
  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  }

  // typecheck arguments
  invariant(Array.isArray(waypoints), 'waypoints must be an array');

  var profile = 'driving';

  if (options.profile) {
    invariant(typeof options.profile === 'string', 'profile option must be string');
    profile = options.profile;
  }

  return this.client({
    path: constants.API_DISTANCE,
    params: {
      profile: profile
    },
    entity: {
      coordinates: waypoints
    },
    method: 'post',
    callback: callback
  });
};

module.exports = MapboxDistance;

},{"../../vendor/invariant":20,"../constants":4,"../make_service":8}],13:[function(require,module,exports){
'use strict';

var invariant = require('../../vendor/invariant'),
  makeService = require('../make_service'),
  constants = require('../constants');

var MapboxGeocoding = makeService('MapboxGeocoding');

var REVERSE_GEOCODING_PRECISION = 5;
var FORWARD_GEOCODING_PROXIMITY_PRECISION = 3;

function roundTo(value, places) {
  var mult = Math.pow(10, places);
  return Math.round(value * mult) / mult;
}

/**
 * Search for a location with a string, using the
 * [Mapbox Geocoding API](https://www.mapbox.com/api-documentation/#geocoding).
 *
 * The `query` parmeter can be an array of strings only if batch geocoding
 * is used by specifying `mapbox.places-permanent` as the `dataset` option.
 *
 * @param {string|Array<string>} query desired location
 * @param {Object} [options={}] additional options meant to tune
 * the request
 * @param {Object} options.proximity a proximity argument: this is
 * a geographical point given as an object with latitude and longitude
 * properties. Search results closer to this point will be given
 * higher priority.
 * @param {Array} options.bbox a bounding box argument: this is
 * a bounding box given as an array in the format [minX, minY, maxX, maxY].
 * Search results will be limited to the bounding box.
 * @param {string} options.types a comma seperated list of types that filter
 * results to match those specified. See https://www.mapbox.com/developers/api/geocoding/#filter-type
 * for available types.
 * @param {number=5} options.limit is the maximum number of results to return, between 1 and 10 inclusive.
 * Some very specific queries may return fewer results than the limit.
 * @param {string} options.country a comma separated list of country codes to
 * limit results to specified country or countries.
 * @param {boolean=true} options.autocomplete whether to include results that include
 * the query only as a prefix. This is useful for UIs where users type
 * values, but if you have complete addresses as input, you'll want to turn it off
 * @param {string} [options.dataset=mapbox.places] the desired data to be
 * geocoded against. The default, mapbox.places, does not permit unlimited
 * caching. `mapbox.places-permanent` is available on request and does
 * permit permanent caching.
 * @param {Function} callback called with (err, results)
 * @returns {undefined} nothing, calls callback
 * @memberof MapboxClient
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 * mapboxClient.geocodeForward('Paris, France', function(err, res) {
 *   // res is a GeoJSON document with geocoding matches
 * });
 * // using the proximity option to weight results closer to texas
 * mapboxClient.geocodeForward('Paris, France', {
 *   proximity: { latitude: 33.6875431, longitude: -95.4431142 }
 * }, function(err, res) {
 *   // res is a GeoJSON document with geocoding matches
 * });
 * // using the bbox option to limit results to a portion of Washington, D.C.
 * mapboxClient.geocodeForward('Starbucks', {
 *   bbox: [-77.083056,38.908611,-76.997778,38.959167]
 * }, function(err, res) {
 *   // res is a GeoJSON document with geocoding matches
 * });
 */
MapboxGeocoding.prototype.geocodeForward = function(query, options, callback) {

  // permit the options argument to be omitted
  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  }

  // typecheck arguments
  if (Array.isArray(query)) {
    if (options.dataset !== 'mapbox.places-permanent') {
      throw new Error('Batch geocoding is only available with the mapbox.places-permanent endpoint. See https://mapbox.com/api-documentation/#batch-requests for details')
    } else {
      query = query.join(';');
    }
  }
  invariant(typeof query === 'string', 'query must be a string');
  invariant(typeof options === 'object', 'options must be an object');

  var queryOptions = {
    query: query,
    dataset: 'mapbox.places'
  };

  var autocomplete = true;
  var precision = FORWARD_GEOCODING_PROXIMITY_PRECISION;
  if (options.precision) {
    invariant(typeof options.precision === 'number', 'precision option must be number');
    precision = options.precision;
  }

  if (options.proximity) {
    invariant(typeof options.proximity.latitude === 'number' &&
      typeof options.proximity.longitude === 'number',
      'proximity must be an object with numeric latitude & longitude properties');
    queryOptions.proximity = roundTo(options.proximity.longitude, precision) + ',' + roundTo(options.proximity.latitude, precision);
  }

  if (options.bbox) {
    invariant(typeof options.bbox[0] === 'number' &&
      typeof options.bbox[1] === 'number' &&
      typeof options.bbox[2] === 'number' &&
      typeof options.bbox[3] === 'number' &&
      options.bbox.length === 4,
      'bbox must be an array with numeric values in the form [minX, minY, maxX, maxY]');
    queryOptions.bbox = options.bbox[0] + "," + options.bbox[1] + "," + options.bbox[2] + "," + options.bbox[3];
  }

  if (options.limit) {
    invariant(typeof options.limit === 'number',
      'limit must be a number');
    queryOptions.limit = options.limit;
  }

  if (options.dataset) {
    invariant(typeof options.dataset === 'string', 'dataset option must be string');
    queryOptions.dataset = options.dataset;
  }

  if (options.country) {
    invariant(typeof options.country === 'string', 'country option must be string');
    queryOptions.country = options.country;
  }

  if (options.types) {
    invariant(typeof options.types === 'string', 'types option must be string');
    queryOptions.types = options.types;
  }

  if (typeof options.autocomplete === 'boolean') {
    invariant(typeof options.autocomplete === 'boolean', 'autocomplete must be a boolean');
    queryOptions.autocomplete = options.autocomplete;
  }

  return this.client({
    path: constants.API_GEOCODING_FORWARD,
    params: queryOptions,
    callback: callback
  });
};

/**
 * Given a location, determine what geographical features are located
 * there. This uses the [Mapbox Geocoding API](https://www.mapbox.com/api-documentation/#geocoding).
 *
 * @param {Object} location the geographical point to search
 * @param {number} location.latitude decimal degrees latitude, in range -90 to 90
 * @param {number} location.longitude decimal degrees longitude, in range -180 to 180
 * @param {Object} [options={}] additional options meant to tune
 * the request.
 * @param {string} options.types a comma seperated list of types that filter
 * results to match those specified. See 
 * https://www.mapbox.com/api-documentation/#retrieve-places-near-a-location
 * for available types.
 * @param {number=1} options.limit is the maximum number of results to return, between 1 and 5
 * inclusive. Requires a single options.types to be specified (see example).
 * @param {string} [options.dataset=mapbox.places] the desired data to be
 * geocoded against. The default, mapbox.places, does not permit unlimited
 * caching. `mapbox.places-permanent` is available on request and does
 * permit permanent caching.
 * @param {Function} callback called with (err, results)
 * @returns {undefined} nothing, calls callback
 * @example
 * var mapboxClient = new MapboxGeocoding('ACCESSTOKEN');
 * mapboxClient.geocodeReverse(
 *   { latitude: 33.6875431, longitude: -95.4431142 },
 *   function(err, res) {
 *   // res is a GeoJSON document with geocoding matches
 * });
 * @example
 * var mapboxClient = new MapboxGeocoding('ACCESSTOKEN');
 * mapboxClient.geocodeReverse(
 *   { latitude: 33.6875431, longitude: -95.4431142, options: { types: address, limit: 3 } },
 *   function(err, res) {
 *   // res is a GeoJSON document with up to 3 geocoding matches
 * });
 */
MapboxGeocoding.prototype.geocodeReverse = function(location, options, callback) {

  // permit the options argument to be omitted
  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  }

  // typecheck arguments
  invariant(typeof location === 'object', 'location must be an object');
  invariant(typeof options === 'object', 'options must be an object');

  invariant(typeof location.latitude === 'number' &&
    typeof location.longitude === 'number',
    'location must be an object with numeric latitude & longitude properties');

  var queryOptions = {
    dataset: 'mapbox.places'
  };

  if (options.dataset) {
    invariant(typeof options.dataset === 'string', 'dataset option must be string');
    queryOptions.dataset = options.dataset;
  }

  var precision = REVERSE_GEOCODING_PRECISION;
  if (options.precision) {
    invariant(typeof options.precision === 'number', 'precision option must be number');
    precision = options.precision;
  }

  if (options.types) {
    invariant(typeof options.types === 'string', 'types option must be string');
    queryOptions.types = options.types;
  }

  if (options.limit) {
    invariant(typeof options.limit === 'number', 'limit option must be a number');
    invariant(options.types.split(',').length === 1, 'a single type must be specified to use the limit option');
    queryOptions.limit = options.limit;
  }

  queryOptions.longitude = roundTo(location.longitude, precision);
  queryOptions.latitude = roundTo(location.latitude, precision);

  return this.client({
    path: constants.API_GEOCODING_REVERSE,
    params: queryOptions,
    callback: callback
  });
};

module.exports = MapboxGeocoding;

},{"../../vendor/invariant":20,"../constants":4,"../make_service":8}],14:[function(require,module,exports){
'use strict';

var invariant = require('../../vendor/invariant'),
  makeService = require('../make_service'),
  constants = require('../constants');

var MapboxMatching = makeService('MapboxMatching');

/**
 * Snap recorded location traces to roads and paths from OpenStreetMap.
 * Consult the [Map Matching API](https://www.mapbox.com/developers/api/map-matching/)
 * for more documentation.
 *
 * @param {Object} trace a single [GeoJSON](http://geojson.org/)
 * Feature with a LineString geometry, containing up to 100 positions.
 * @param {Object} [options={}] additional options meant to tune
 * the request
 * @param {string} [options.profile=mapbox.driving] the directions
 * profile, which determines how to prioritize different routes.
 * Options are `'mapbox.driving'`, which assumes transportation via an
 * automobile and will use highways, `'mapbox.walking'`, which avoids
 * streets without sidewalks, and `'mapbox.cycling'`, which prefers streets
 * with bicycle lanes and lower speed limits for transportation via
 * bicycle.
 * @param {string} [options.geometry=geojson] format for the returned
 * route. Options are `'geojson'`, `'polyline'`, or `false`: `polyline`
 * yields more compact responses which can be decoded on the client side.
 * [GeoJSON](http://geojson.org/), the default, is compatible with libraries
 * like [Mapbox GL](https://www.mapbox.com/mapbox-gl/),
 * Leaflet and [Mapbox.js](https://www.mapbox.com/mapbox.js/). `false`
 * omits the geometry entirely and only returns matched points.
 * @param {number} [options.gps_precision=4] An integer in meters indicating
 * the assumed precision of the used tracking device. Use higher
 * numbers (5-10) for noisy traces and lower numbers (1-3) for clean
 * traces. The default value is 4.
 * @param {Function} callback called with (err, results)
 * @returns {undefined} nothing, calls callback
 * @memberof MapboxClient
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 * mapboxClient.matching({
 *   "type": "Feature",
 *   "properties": {
 *     "coordTimes": [
 *       "2015-04-21T06:00:00Z",
 *       "2015-04-21T06:00:05Z",
 *       "2015-04-21T06:00:10Z",
 *       "2015-04-21T06:00:15Z",
 *       "2015-04-21T06:00:20Z"
 *     ]
 *     },
 *   "geometry": {
 *     "type": "LineString",
 *     "coordinates": [
 *       [ 13.418946862220764, 52.50055852688439 ],
 *       [ 13.419011235237122, 52.50113000479732 ],
 *       [ 13.419756889343262, 52.50171780290061 ],
 *       [ 13.419885635375975, 52.50237416816131 ],
 *       [ 13.420631289482117, 52.50294888790448 ]
 *     ]
 *   }
 * },
 *   function(err, res) {
 *   // res is a document with directions
 * });
 */
MapboxMatching.prototype.matching = function(trace, options, callback) {

  // permit the options argument to be omitted
  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  }

  // typecheck arguments
  invariant(typeof trace === 'object', 'trace must be an object');
  invariant(typeof options === 'object', 'options must be an object');

  var profile = 'mapbox.driving',
    gps_precision = 4,
    geometry = 'geojson';


  if (options.gps_precision !== undefined) {
    invariant(typeof options.gps_precision === 'number', 'gps_precision must be a number');
    gps_precision = options.gps_precision;
  }

  if (options.profile) {
    invariant(typeof options.profile === 'string', 'profile option must be string');
    profile = options.profile;
  }

  if (options.geometry) {
    invariant(typeof options.geometry === 'string', 'geometry option must be string');
    geometry = options.geometry;
  }

  return this.client({
    path: constants.API_MATCHING,
    params: {
      profile: profile,
      geometry: geometry,
      gps_precision: gps_precision
    },
    method: 'post',
    entity: trace,
    callback: callback
  });
};

module.exports = MapboxMatching;

},{"../../vendor/invariant":20,"../constants":4,"../make_service":8}],15:[function(require,module,exports){
'use strict';

var invariant = require('../../vendor/invariant'),
  formatPoints = require('../format_points'),
  makeService = require('../make_service'),
  constants = require('../constants');

var MapboxSurface = makeService('MapboxSurface');

/**
 * Given a list of locations, retrieve vector tiles, find the nearest
 * spatial features, extract their data values, and then absolute values and
 * optionally interpolated values in-between, if the interpolate option is specified.
 *
 * Consult the [Surface API](https://www.mapbox.com/developers/api/surface/)
 * for more documentation.
 *
 * @param {string} mapid a Mapbox mapid containing vector tiles against
 * which we'll query
 * @param {string} layer layer within the given `mapid` for which to pull
 * data
 * @param {Array<string>} fields layer within the given `mapid` for which to pull
 * data
 * @param {Array<Object>|string} path either an encoded polyline,
 * provided as a string, or an array of objects with longitude and latitude
 * properties, similar to waypoints.
 * @param {Object} [options={}] additional options meant to tune
 * the request
 * @param {string} [options.geojson=false] whether to return data as a
 * GeoJSON point
 * @param {string} [options.zoom=maximum] zoom level at which features
 * are queried
 * @param {boolean} [options.interpolate=true] Whether to interpolate
 * between matches in the feature collection.
 * @param {Function} callback called with (err, results)
 * @memberof MapboxClient
 * @returns {undefined} nothing, calls callback
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 */
MapboxSurface.prototype.surface = function(mapid, layer, fields, path, options, callback) {

  // permit the options argument to be omitted
  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  }

  // typecheck arguments
  invariant(typeof mapid === 'string', 'mapid must be a string');
  invariant(typeof layer === 'string', 'layer must be a string');
  invariant(Array.isArray(fields), 'fields must be an array of strings');
  invariant(Array.isArray(path) || typeof path === 'string', 'path must be an array of objects or a string');
  invariant(typeof options === 'object', 'options must be an object');

  var interpolate = true,
    geojson = false;

  if (options.interpolate !== undefined) {
    invariant(typeof options.interpolate === 'boolean', 'interpolate must be a boolean');
    interpolate = options.interpolate;
  }

  if (options.geojson !== undefined) {
    invariant(typeof options.geojson === 'boolean', 'geojson option must be boolean');
    geojson = options.geojson;
  }

  var surfaceOptions = {
    geojson: geojson,
    layer: layer,
    mapid: mapid,
    fields: fields.join(','),
    interpolate: interpolate
  };

  if (Array.isArray(path)) {
    surfaceOptions.points = formatPoints(path);
  } else {
    surfaceOptions.encoded_polyline = path;
  }

  if (options.zoom !== undefined) {
    invariant(typeof options.zoom === 'number', 'zoom must be a number');
    surfaceOptions.z = options.zoom;
  }

  return this.client({
    path: constants.API_SURFACE,
    params: surfaceOptions,
    callback: callback
  });
};

module.exports = MapboxSurface;

},{"../../vendor/invariant":20,"../constants":4,"../format_points":5,"../make_service":8}],16:[function(require,module,exports){
'use strict';

var invariant = require('../../vendor/invariant'),
  makeService = require('../make_service'),
  constants = require('../constants');

var Tilestats = module.exports = makeService('MapboxTilestats');

/**
 * To retrieve statistics about a specific tileset.
 *
 * @param {String} tileset - the id for the tileset
 * @param {Function} callback called with (err, tilestats)
 * @returns {undefined} nothing, calls callback
 * @example
 * var client = new MapboxClient('ACCESSTOKEN');
 * client.getTilestats('tileset-id', function(err, info) {
 *   console.log(info);
 *   // {
 *   //   "layerCount": {layer count},
 *   //   "layers": [
 *   //     {
 *   //       "layer": {layer name},
 *   //       "geometry": {dominant geometry},
 *   //       "count": {feature count},
 *   //       "attributeCount": {attribute count}
 *   //       "attributes": [
 *   //         {
 *   //           "attribute": {attribute name},
 *   //           "type": {attribute type},
 *   //           "count": {unique value count},
 *   //           "min": {minimum value if type is number},
 *   //           "max": {maximum value if type is number},
 *   //           "values": [{...unique values}]
 *   //         }
 *   //       ]
 *   //     }
 *   //   ]
 *   // }
 * });
 */
Tilestats.prototype.getTilestats = function(tileset, callback) {
  invariant(typeof tileset === 'string', 'tileset must be a string');

  var owner = tileset.split('.')[0];
  if (owner === tileset) owner = this.owner;

  return this.client({
    path: constants.API_TILESTATS_STATISTICS,
    params: {
      owner: owner,
      tileset: tileset
    },
    callback: callback
  });
};


/**
 * To create or update statistics about a specific tileset.
 *
 * @param {String} tileset - the id for the tileset
 * @param {object} statistics - the statistics to upload
 * @param {Function} callback called with (err, tilestats)
 * @returns {undefined} nothing, calls callback
 * @example
 * var client = new MapboxClient('ACCESSTOKEN');
 * client.getTilestats('tileset-id', function(err, stats) {
 *   console.log(stats);
 *   // {
 *   //   "account": {account}
 *   //   ... see stats example above (for Tilestats#getTilestats)
 *   // }
 * });
 */
Tilestats.prototype.putTilestats = function(tileset, statistics, callback) {
  invariant(typeof tileset === 'string', 'tileset must be a string');

  var owner = tileset.split('.')[0];
  if (owner === tileset) owner = this.owner;

  return this.client({
    path: constants.API_TILESTATS_STATISTICS,
    params: {
      owner: owner,
      tileset: tileset
    },
    entity: statistics,
    method: 'put',
    callback: callback
  });
};

},{"../../vendor/invariant":20,"../constants":4,"../make_service":8}],17:[function(require,module,exports){
'use strict';

var invariant = require('../../vendor/invariant'),
  makeService = require('../make_service'),
  constants = require('../constants');

var Uploads = module.exports = makeService('MapboxUploads');

/**
 * Retrieve a listing of uploads for a particular account.
 *
 * This request requires an access token with the uploads:list scope.
 *
 * @param {Function} callback called with (err, uploads)
 * @returns {undefined} nothing, calls callback
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 * mapboxClient.listUploads(function(err, uploads) {
 *   console.log(uploads);
 *   // [
 *   //   {
 *   //     "complete": true,
 *   //     "tileset": "example.mbtiles",
 *   //     "error": null,
 *   //     "id": "abc123",
 *   //     "modified": "2014-11-21T19:41:10.000Z",
 *   //     "created": "2014-11-21T19:41:10.000Z",
 *   //     "owner": "example",
 *   //     "progress": 1
 *   //   },
 *   //   {
 *   //     "complete": false,
 *   //     "tileset": "example.foo",
 *   //     "error": null,
 *   //     "id": "xyz789",
 *   //     "modified": "2014-11-21T19:41:10.000Z",
 *   //     "created": "2014-11-21T19:41:10.000Z",
 *   //     "owner": "example",
 *   //     "progress": 0
 *   //   }
 *   // ]
 * });
 */
Uploads.prototype.listUploads = function(callback) {
  return this.client({
    path: constants.API_UPLOADS,
    params: { owner: this.owner },
    callback: callback
  });
};

/**
 * Retrieve credentials that allow a new file to be staged on Amazon S3
 * while an upload is processed. All uploads must be staged using these
 * credentials before being uploaded to Mapbox.
 *
 * This request requires an access token with the uploads:write scope.
 *
 * @param {Function} callback called with (err, credentials)
 * @returns {undefined} nothing, calls callback
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 * mapboxClient.createUploadCredentials(function(err, credentials) {
 *   console.log(credentials);
 *   // {
 *   //   "accessKeyId": "{accessKeyId}",
 *   //   "bucket": "somebucket",
 *   //   "key": "hij456",
 *   //   "secretAccessKey": "{secretAccessKey}",
 *   //   "sessionToken": "{sessionToken}",
 *   //   "url": "{s3 url}"
 *   // }
 *
 *   // Use aws-sdk to stage the file on Amazon S3
 *   var AWS = require('aws-sdk');
 *   var s3 = new AWS.S3({
 *        accessKeyId: credentials.accessKeyId,
 *        secretAccessKey: credentials.secretAccessKey,
 *        sessionToken: credentials.sessionToken,
 *        region: 'us-east-1'
 *   });
 *   s3.putObject({
 *     Bucket: credentials.bucket,
 *     Key: credentials.key,
 *     Body: fs.createReadStream('/path/to/file.mbtiles')
 *   }, function(err, resp) {
 *   });
 * });
 */
Uploads.prototype.createUploadCredentials = function(callback) {
  return this.client({
    path: constants.API_UPLOAD_CREDENTIALS,
    params: { owner: this.owner },
    callback: callback
  });
};

/**
 * Create an new upload with a file previously staged on Amazon S3.
 *
 * This request requires an access token with the uploads:write scope.
 *
 * @param {Object} options an object that defines the upload's properties
 * @param {String} options.tileset id of the tileset to create or
 * replace. This must consist of an account id and a unique key
 * separated by a period. Reuse of a tileset value will overwrite
 * existing data. To avoid overwriting existing data, you must ensure
 * that you are using unique tileset ids.
 * @param {String} options.url https url of a file staged on Amazon S3.
 * @param {Function} callback called with (err, upload)
 * @returns {undefined} nothing, calls callback
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 * // Response from a call to createUploadCredentials
 * var credentials = {
 *   "accessKeyId": "{accessKeyId}",
 *   "bucket": "somebucket",
 *   "key": "hij456",
 *   "secretAccessKey": "{secretAccessKey}",
 *   "sessionToken": "{sessionToken}",
 *   "url": "{s3 url}"
 * };
 * mapboxClient.createUpload({
 *    tileset: [accountid, 'mytileset'].join('.'),
 *    url: credentials.url
 * }, function(err, upload) {
 *   console.log(upload);
 *   // {
 *   //   "complete": false,
 *   //   "tileset": "example.markers",
 *   //   "error": null,
 *   //   "id": "hij456",
 *   //   "modified": "2014-11-21T19:41:10.000Z",
 *   //   "created": "2014-11-21T19:41:10.000Z",
 *   //   "owner": "example",
 *   //   "progress": 0
 *   // }
 * });
 */
Uploads.prototype.createUpload = function(options, callback) {
  invariant(typeof options === 'object', 'options must be an object');

  return this.client({
    path: constants.API_UPLOADS,
    params: { owner: this.owner },
    entity: options,
    callback: callback
  });
};

/**
 * Retrieve state of an upload.
 *
 * This request requires an access token with the uploads:read scope.
 *
 * @param {String} upload id of the upload to read
 * @param {Function} callback called with (err, upload)
 * @returns {undefined} nothing, calls callback
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 * mapboxClient.readUpload('hij456', function(err, upload) {
 *   console.log(upload);
 *   // {
 *   //   "complete": true,
 *   //   "tileset": "example.markers",
 *   //   "error": null,
 *   //   "id": "hij456",
 *   //   "modified": "2014-11-21T19:41:10.000Z",
 *   //   "created": "2014-11-21T19:41:10.000Z",
 *   //   "owner": "example",
 *   //   "progress": 1
 *   // }
 * });
 */
Uploads.prototype.readUpload = function(upload, callback) {
  invariant(typeof upload === 'string', 'upload must be a string');

  return this.client({
    path: constants.API_UPLOAD,
    params: {
      owner: this.owner,
      upload: upload
    },
    callback: callback
  });
};

/**
 * Delete a completed upload. In-progress uploads cannot be deleted.
 *
 * This request requires an access token with the uploads:delete scope.
 *
 * @param {Function} callback called with (err)
 * @returns {undefined} nothing, calls callback
 * @example
 * var mapboxClient = new MapboxClient('ACCESSTOKEN');
 * mapboxClient.deleteUpload('hij456', function(err) {
 * });
 */
Uploads.prototype.deleteUpload = function(upload, callback) {
  invariant(typeof upload === 'string', 'upload must be a string');

  return this.client({
    method: 'delete',
    path: constants.API_UPLOAD,
    params: {
      owner: this.owner,
      upload: upload
    },
    callback: callback
  });
};

},{"../../vendor/invariant":20,"../constants":4,"../make_service":8}],18:[function(require,module,exports){
var interceptor = require('rest/interceptor');

var standardResponse = interceptor({
  response: transform,
});

function transform(response) {
  return {
    url: response.url,
    status: response.status ? response.status.code : undefined,
    headers: response.headers,
    entity: response.entity,
    error: response.error,
    callback: response.request.callback
  };
};

module.exports = standardResponse;

},{"rest/interceptor":28}],19:[function(require,module,exports){
/* eslint-disable */
/*
 * hat
 * written by James Halliday, licensed under MIT/X11
 * https://github.com/substack/node-hat
 */
var hat = module.exports = function (bits, base) {
    if (!base) base = 16;
    if (bits === undefined) bits = 128;
    if (bits <= 0) return '0';
    
    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    for (var i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }
    
    var rem = digits - Math.floor(digits);
    
    var res = '';
    
    for (var i = 0; i < Math.floor(digits); i++) {
        var x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }
    
    if (rem) {
        var b = Math.pow(base, rem);
        var x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }
    
    var parsed = parseInt(res, base);
    if (parsed !== Infinity && parsed >= Math.pow(2, bits)) {
        return hat(bits, base)
    }
    else return res;
};

},{}],20:[function(require,module,exports){
(function (process){
/*
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/*
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var NODE_ENV = process.env.NODE_ENV;

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

}).call(this,require('_process'))
},{"_process":51}],21:[function(require,module,exports){
(function (process,global){
!function(t){"object"==typeof exports?module.exports=t():"function"==typeof define&&define.amd?define(t):"undefined"!=typeof window?window.Promise=t():"undefined"!=typeof global?global.Promise=t():"undefined"!=typeof self&&(self.Promise=t())}(function(){var t;return function e(t,n,o){function r(u,c){if(!n[u]){if(!t[u]){var f="function"==typeof require&&require;if(!c&&f)return f(u,!0);if(i)return i(u,!0);throw new Error("Cannot find module '"+u+"'")}var s=n[u]={exports:{}};t[u][0].call(s.exports,function(e){var n=t[u][1][e];return r(n?n:e)},s,s.exports,e,t,n,o)}return n[u].exports}for(var i="function"==typeof require&&require,u=0;u<o.length;u++)r(o[u]);return r}({1:[function(t,e,n){var o=t("../lib/decorators/unhandledRejection"),r=o(t("../lib/Promise"));e.exports="undefined"!=typeof global?global.Promise=r:"undefined"!=typeof self?self.Promise=r:r},{"../lib/Promise":2,"../lib/decorators/unhandledRejection":4}],2:[function(e,n,o){!function(t){"use strict";t(function(t){var e=t("./makePromise"),n=t("./Scheduler"),o=t("./env").asap;return e({scheduler:new n(o)})})}("function"==typeof t&&t.amd?t:function(t){n.exports=t(e)})},{"./Scheduler":3,"./env":5,"./makePromise":7}],3:[function(e,n,o){!function(t){"use strict";t(function(){function t(t){this._async=t,this._running=!1,this._queue=this,this._queueLen=0,this._afterQueue={},this._afterQueueLen=0;var e=this;this.drain=function(){e._drain()}}return t.prototype.enqueue=function(t){this._queue[this._queueLen++]=t,this.run()},t.prototype.afterQueue=function(t){this._afterQueue[this._afterQueueLen++]=t,this.run()},t.prototype.run=function(){this._running||(this._running=!0,this._async(this.drain))},t.prototype._drain=function(){for(var t=0;t<this._queueLen;++t)this._queue[t].run(),this._queue[t]=void 0;for(this._queueLen=0,this._running=!1,t=0;t<this._afterQueueLen;++t)this._afterQueue[t].run(),this._afterQueue[t]=void 0;this._afterQueueLen=0},t})}("function"==typeof t&&t.amd?t:function(t){n.exports=t()})},{}],4:[function(e,n,o){!function(t){"use strict";t(function(t){function e(t){throw t}function n(){}var o=t("../env").setTimer,r=t("../format");return function(t){function i(t){t.handled||(l.push(t),a("Potentially unhandled rejection ["+t.id+"] "+r.formatError(t.value)))}function u(t){var e=l.indexOf(t);e>=0&&(l.splice(e,1),h("Handled previous rejection ["+t.id+"] "+r.formatObject(t.value)))}function c(t,e){p.push(t,e),null===d&&(d=o(f,0))}function f(){for(d=null;p.length>0;)p.shift()(p.shift())}var s,a=n,h=n;"undefined"!=typeof console&&(s=console,a="undefined"!=typeof s.error?function(t){s.error(t)}:function(t){s.log(t)},h="undefined"!=typeof s.info?function(t){s.info(t)}:function(t){s.log(t)}),t.onPotentiallyUnhandledRejection=function(t){c(i,t)},t.onPotentiallyUnhandledRejectionHandled=function(t){c(u,t)},t.onFatalRejection=function(t){c(e,t.value)};var p=[],l=[],d=null;return t}})}("function"==typeof t&&t.amd?t:function(t){n.exports=t(e)})},{"../env":5,"../format":6}],5:[function(e,n,o){!function(t){"use strict";t(function(t){function e(){return"undefined"!=typeof process&&"[object process]"===Object.prototype.toString.call(process)}function n(){return"function"==typeof MutationObserver&&MutationObserver||"function"==typeof WebKitMutationObserver&&WebKitMutationObserver}function o(t){function e(){var t=n;n=void 0,t()}var n,o=document.createTextNode(""),r=new t(e);r.observe(o,{characterData:!0});var i=0;return function(t){n=t,o.data=i^=1}}var r,i="undefined"!=typeof setTimeout&&setTimeout,u=function(t,e){return setTimeout(t,e)},c=function(t){return clearTimeout(t)},f=function(t){return i(t,0)};if(e())f=function(t){return process.nextTick(t)};else if(r=n())f=o(r);else if(!i){var s=t,a=s("vertx");u=function(t,e){return a.setTimer(e,t)},c=a.cancelTimer,f=a.runOnLoop||a.runOnContext}return{setTimer:u,clearTimer:c,asap:f}})}("function"==typeof t&&t.amd?t:function(t){n.exports=t(e)})},{}],6:[function(e,n,o){!function(t){"use strict";t(function(){function t(t){var n="object"==typeof t&&null!==t&&(t.stack||t.message)?t.stack||t.message:e(t);return t instanceof Error?n:n+" (WARNING: non-Error used)"}function e(t){var e=String(t);return"[object Object]"===e&&"undefined"!=typeof JSON&&(e=n(t,e)),e}function n(t,e){try{return JSON.stringify(t)}catch(n){return e}}return{formatError:t,formatObject:e,tryStringify:n}})}("function"==typeof t&&t.amd?t:function(t){n.exports=t()})},{}],7:[function(e,n,o){!function(t){"use strict";t(function(){return function(t){function e(t,e){this._handler=t===_?e:n(t)}function n(t){function e(t){r.resolve(t)}function n(t){r.reject(t)}function o(t){r.notify(t)}var r=new b;try{t(e,n,o)}catch(i){n(i)}return r}function o(t){return S(t)?t:new e(_,new x(y(t)))}function r(t){return new e(_,new x(new P(t)))}function i(){return $}function u(){return new e(_,new b)}function c(t,e){var n=new b(t.receiver,t.join().context);return new e(_,n)}function f(t){return a(K,null,t)}function s(t,e){return a(F,t,e)}function a(t,n,o){function r(e,r,u){u.resolved||h(o,i,e,t(n,r,e),u)}function i(t,e,n){a[t]=e,0===--s&&n.become(new q(a))}for(var u,c="function"==typeof n?r:i,f=new b,s=o.length>>>0,a=new Array(s),p=0;p<o.length&&!f.resolved;++p)u=o[p],void 0!==u||p in o?h(o,c,p,u,f):--s;return 0===s&&f.become(new q(a)),new e(_,f)}function h(t,e,n,o,r){if(U(o)){var i=m(o),u=i.state();0===u?i.fold(e,n,void 0,r):u>0?e(n,i.value,r):(r.become(i),p(t,n+1,i))}else e(n,o,r)}function p(t,e,n){for(var o=e;o<t.length;++o)l(y(t[o]),n)}function l(t,e){if(t!==e){var n=t.state();0===n?t.visit(t,void 0,t._unreport):0>n&&t._unreport()}}function d(t){return"object"!=typeof t||null===t?r(new TypeError("non-iterable passed to race()")):0===t.length?i():1===t.length?o(t[0]):v(t)}function v(t){var n,o,r,i=new b;for(n=0;n<t.length;++n)if(o=t[n],void 0!==o||n in t){if(r=y(o),0!==r.state()){i.become(r),p(t,n+1,r);break}r.visit(i,i.resolve,i.reject)}return new e(_,i)}function y(t){return S(t)?t._handler.join():U(t)?j(t):new q(t)}function m(t){return S(t)?t._handler.join():j(t)}function j(t){try{var e=t.then;return"function"==typeof e?new g(e,t):new q(t)}catch(n){return new P(n)}}function _(){}function w(){}function b(t,n){e.createContext(this,n),this.consumers=void 0,this.receiver=t,this.handler=void 0,this.resolved=!1}function x(t){this.handler=t}function g(t,e){b.call(this),I.enqueue(new E(t,e,this))}function q(t){e.createContext(this),this.value=t}function P(t){e.createContext(this),this.id=++Y,this.value=t,this.handled=!1,this.reported=!1,this._report()}function R(t,e){this.rejection=t,this.context=e}function C(t){this.rejection=t}function O(){return new P(new TypeError("Promise cycle"))}function T(t,e){this.continuation=t,this.handler=e}function Q(t,e){this.handler=e,this.value=t}function E(t,e,n){this._then=t,this.thenable=e,this.resolver=n}function L(t,e,n,o,r){try{t.call(e,n,o,r)}catch(i){o(i)}}function k(t,e,n,o){this.f=t,this.z=e,this.c=n,this.to=o,this.resolver=X,this.receiver=this}function S(t){return t instanceof e}function U(t){return("object"==typeof t||"function"==typeof t)&&null!==t}function H(t,n,o,r){return"function"!=typeof t?r.become(n):(e.enterContext(n),W(t,n.value,o,r),void e.exitContext())}function N(t,n,o,r,i){return"function"!=typeof t?i.become(o):(e.enterContext(o),z(t,n,o.value,r,i),void e.exitContext())}function M(t,n,o,r,i){return"function"!=typeof t?i.notify(n):(e.enterContext(o),A(t,n,r,i),void e.exitContext())}function F(t,e,n){try{return t(e,n)}catch(o){return r(o)}}function W(t,e,n,o){try{o.become(y(t.call(n,e)))}catch(r){o.become(new P(r))}}function z(t,e,n,o,r){try{t.call(o,e,n,r)}catch(i){r.become(new P(i))}}function A(t,e,n,o){try{o.notify(t.call(n,e))}catch(r){o.notify(r)}}function J(t,e){e.prototype=V(t.prototype),e.prototype.constructor=e}function K(t,e){return e}function D(){}function G(){return"undefined"!=typeof process&&null!==process&&"function"==typeof process.emit?function(t,e){return"unhandledRejection"===t?process.emit(t,e.value,e):process.emit(t,e)}:"undefined"!=typeof self&&"function"==typeof CustomEvent?function(t,e,n){var o=!1;try{var r=new n("unhandledRejection");o=r instanceof n}catch(i){}return o?function(t,o){var r=new n(t,{detail:{reason:o.value,key:o},bubbles:!1,cancelable:!0});return!e.dispatchEvent(r)}:t}(D,self,CustomEvent):D}var I=t.scheduler,B=G(),V=Object.create||function(t){function e(){}return e.prototype=t,new e};e.resolve=o,e.reject=r,e.never=i,e._defer=u,e._handler=y,e.prototype.then=function(t,e,n){var o=this._handler,r=o.join().state();if("function"!=typeof t&&r>0||"function"!=typeof e&&0>r)return new this.constructor(_,o);var i=this._beget(),u=i._handler;return o.chain(u,o.receiver,t,e,n),i},e.prototype["catch"]=function(t){return this.then(void 0,t)},e.prototype._beget=function(){return c(this._handler,this.constructor)},e.all=f,e.race=d,e._traverse=s,e._visitRemaining=p,_.prototype.when=_.prototype.become=_.prototype.notify=_.prototype.fail=_.prototype._unreport=_.prototype._report=D,_.prototype._state=0,_.prototype.state=function(){return this._state},_.prototype.join=function(){for(var t=this;void 0!==t.handler;)t=t.handler;return t},_.prototype.chain=function(t,e,n,o,r){this.when({resolver:t,receiver:e,fulfilled:n,rejected:o,progress:r})},_.prototype.visit=function(t,e,n,o){this.chain(X,t,e,n,o)},_.prototype.fold=function(t,e,n,o){this.when(new k(t,e,n,o))},J(_,w),w.prototype.become=function(t){t.fail()};var X=new w;J(_,b),b.prototype._state=0,b.prototype.resolve=function(t){this.become(y(t))},b.prototype.reject=function(t){this.resolved||this.become(new P(t))},b.prototype.join=function(){if(!this.resolved)return this;for(var t=this;void 0!==t.handler;)if(t=t.handler,t===this)return this.handler=O();return t},b.prototype.run=function(){var t=this.consumers,e=this.handler;this.handler=this.handler.join(),this.consumers=void 0;for(var n=0;n<t.length;++n)e.when(t[n])},b.prototype.become=function(t){this.resolved||(this.resolved=!0,this.handler=t,void 0!==this.consumers&&I.enqueue(this),void 0!==this.context&&t._report(this.context))},b.prototype.when=function(t){this.resolved?I.enqueue(new T(t,this.handler)):void 0===this.consumers?this.consumers=[t]:this.consumers.push(t)},b.prototype.notify=function(t){this.resolved||I.enqueue(new Q(t,this))},b.prototype.fail=function(t){var e="undefined"==typeof t?this.context:t;this.resolved&&this.handler.join().fail(e)},b.prototype._report=function(t){this.resolved&&this.handler.join()._report(t)},b.prototype._unreport=function(){this.resolved&&this.handler.join()._unreport()},J(_,x),x.prototype.when=function(t){I.enqueue(new T(t,this))},x.prototype._report=function(t){this.join()._report(t)},x.prototype._unreport=function(){this.join()._unreport()},J(b,g),J(_,q),q.prototype._state=1,q.prototype.fold=function(t,e,n,o){N(t,e,this,n,o)},q.prototype.when=function(t){H(t.fulfilled,this,t.receiver,t.resolver)};var Y=0;J(_,P),P.prototype._state=-1,P.prototype.fold=function(t,e,n,o){o.become(this)},P.prototype.when=function(t){"function"==typeof t.rejected&&this._unreport(),H(t.rejected,this,t.receiver,t.resolver)},P.prototype._report=function(t){I.afterQueue(new R(this,t))},P.prototype._unreport=function(){this.handled||(this.handled=!0,I.afterQueue(new C(this)))},P.prototype.fail=function(t){this.reported=!0,B("unhandledRejection",this),e.onFatalRejection(this,void 0===t?this.context:t)},R.prototype.run=function(){this.rejection.handled||this.rejection.reported||(this.rejection.reported=!0,B("unhandledRejection",this.rejection)||e.onPotentiallyUnhandledRejection(this.rejection,this.context))},C.prototype.run=function(){this.rejection.reported&&(B("rejectionHandled",this.rejection)||e.onPotentiallyUnhandledRejectionHandled(this.rejection))},e.createContext=e.enterContext=e.exitContext=e.onPotentiallyUnhandledRejection=e.onPotentiallyUnhandledRejectionHandled=e.onFatalRejection=D;var Z=new _,$=new e(_,Z);return T.prototype.run=function(){this.handler.join().when(this.continuation)},Q.prototype.run=function(){var t=this.handler.consumers;if(void 0!==t)for(var e,n=0;n<t.length;++n)e=t[n],M(e.progress,this.value,this.handler,e.receiver,e.resolver)},E.prototype.run=function(){function t(t){o.resolve(t)}function e(t){o.reject(t)}function n(t){o.notify(t)}var o=this.resolver;L(this._then,this.thenable,t,e,n)},k.prototype.fulfilled=function(t){this.f.call(this.c,this.z,t,this.to)},k.prototype.rejected=function(t){this.to.reject(t)},k.prototype.progress=function(t){this.to.notify(t)},e}})}("function"==typeof t&&t.amd?t:function(t){n.exports=t()})},{}]},{},[1])(1)});


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":51}],22:[function(require,module,exports){
/*
 * xtend by Jake Verbaten
 *
 * Licensed under MIT
 * https://github.com/Raynos/xtend
 */
module.exports.extendMutable = extendMutable
module.exports.extend = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extendMutable(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}


function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],23:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var mixin, xWWWFormURLEncoder, origin, urlRE, absoluteUrlRE, fullyQualifiedUrlRE;

mixin = require('./util/mixin');
xWWWFormURLEncoder = require('./mime/type/application/x-www-form-urlencoded');

urlRE = /([a-z][a-z0-9\+\-\.]*:)\/\/([^@]+@)?(([^:\/]+)(:([0-9]+))?)?(\/[^?#]*)?(\?[^#]*)?(#\S*)?/i;
absoluteUrlRE = /^([a-z][a-z0-9\-\+\.]*:\/\/|\/)/i;
fullyQualifiedUrlRE = /([a-z][a-z0-9\+\-\.]*:)\/\/([^@]+@)?(([^:\/]+)(:([0-9]+))?)?\//i;

/**
 * Apply params to the template to create a URL.
 *
 * Parameters that are not applied directly to the template, are appended
 * to the URL as query string parameters.
 *
 * @param {string} template the URI template
 * @param {Object} params parameters to apply to the template
 * @return {string} the resulting URL
 */
function buildUrl(template, params) {
	// internal builder to convert template with params.
	var url, name, queryStringParams, queryString, re;

	url = template;
	queryStringParams = {};

	if (params) {
		for (name in params) {
			/*jshint forin:false */
			re = new RegExp('\\{' + name + '\\}');
			if (re.test(url)) {
				url = url.replace(re, encodeURIComponent(params[name]), 'g');
			}
			else {
				queryStringParams[name] = params[name];
			}
		}

		queryString = xWWWFormURLEncoder.write(queryStringParams);
		if (queryString) {
			url += url.indexOf('?') === -1 ? '?' : '&';
			url += queryString;
		}
	}
	return url;
}

function startsWith(str, test) {
	return str.indexOf(test) === 0;
}

/**
 * Create a new URL Builder
 *
 * @param {string|UrlBuilder} template the base template to build from, may be another UrlBuilder
 * @param {Object} [params] base parameters
 * @constructor
 */
function UrlBuilder(template, params) {
	if (!(this instanceof UrlBuilder)) {
		// invoke as a constructor
		return new UrlBuilder(template, params);
	}

	if (template instanceof UrlBuilder) {
		this._template = template.template;
		this._params = mixin({}, this._params, params);
	}
	else {
		this._template = (template || '').toString();
		this._params = params || {};
	}
}

UrlBuilder.prototype = {

	/**
	 * Create a new UrlBuilder instance that extends the current builder.
	 * The current builder is unmodified.
	 *
	 * @param {string} [template] URL template to append to the current template
	 * @param {Object} [params] params to combine with current params.  New params override existing params
	 * @return {UrlBuilder} the new builder
	 */
	append: function (template,  params) {
		// TODO consider query strings and fragments
		return new UrlBuilder(this._template + template, mixin({}, this._params, params));
	},

	/**
	 * Create a new UrlBuilder with a fully qualified URL based on the
	 * window's location or base href and the current templates relative URL.
	 *
	 * Path variables are preserved.
	 *
	 * *Browser only*
	 *
	 * @return {UrlBuilder} the fully qualified URL template
	 */
	fullyQualify: function () {
		if (typeof location === 'undefined') { return this; }
		if (this.isFullyQualified()) { return this; }

		var template = this._template;

		if (startsWith(template, '//')) {
			template = origin.protocol + template;
		}
		else if (startsWith(template, '/')) {
			template = origin.origin + template;
		}
		else if (!this.isAbsolute()) {
			template = origin.origin + origin.pathname.substring(0, origin.pathname.lastIndexOf('/') + 1);
		}

		if (template.indexOf('/', 8) === -1) {
			// default the pathname to '/'
			template = template + '/';
		}

		return new UrlBuilder(template, this._params);
	},

	/**
	 * True if the URL is absolute
	 *
	 * @return {boolean}
	 */
	isAbsolute: function () {
		return absoluteUrlRE.test(this.build());
	},

	/**
	 * True if the URL is fully qualified
	 *
	 * @return {boolean}
	 */
	isFullyQualified: function () {
		return fullyQualifiedUrlRE.test(this.build());
	},

	/**
	 * True if the URL is cross origin. The protocol, host and port must not be
	 * the same in order to be cross origin,
	 *
	 * @return {boolean}
	 */
	isCrossOrigin: function () {
		if (!origin) {
			return true;
		}
		var url = this.parts();
		return url.protocol !== origin.protocol ||
		       url.hostname !== origin.hostname ||
		       url.port !== origin.port;
	},

	/**
	 * Split a URL into its consituent parts following the naming convention of
	 * 'window.location'. One difference is that the port will contain the
	 * protocol default if not specified.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/DOM/window.location
	 *
	 * @returns {Object} a 'window.location'-like object
	 */
	parts: function () {
		/*jshint maxcomplexity:20 */
		var url, parts;
		url = this.fullyQualify().build().match(urlRE);
		parts = {
			href: url[0],
			protocol: url[1],
			host: url[3] || '',
			hostname: url[4] || '',
			port: url[6],
			pathname: url[7] || '',
			search: url[8] || '',
			hash: url[9] || ''
		};
		parts.origin = parts.protocol + '//' + parts.host;
		parts.port = parts.port || (parts.protocol === 'https:' ? '443' : parts.protocol === 'http:' ? '80' : '');
		return parts;
	},

	/**
	 * Expand the template replacing path variables with parameters
	 *
	 * @param {Object} [params] params to combine with current params.  New params override existing params
	 * @return {string} the expanded URL
	 */
	build: function (params) {
		return buildUrl(this._template, mixin({}, this._params, params));
	},

	/**
	 * @see build
	 */
	toString: function () {
		return this.build();
	}

};

origin = typeof location !== 'undefined' ? new UrlBuilder(location.href).parts() : void 0;

module.exports = UrlBuilder;

},{"./mime/type/application/x-www-form-urlencoded":39,"./util/mixin":46}],24:[function(require,module,exports){
/*
 * Copyright 2014-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var rest = require('./client/default'),
    browser = require('./client/xhr');

rest.setPlatformDefaultClient(browser);

module.exports = rest;

},{"./client/default":26,"./client/xhr":27}],25:[function(require,module,exports){
/*
 * Copyright 2014-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

/**
 * Add common helper methods to a client impl
 *
 * @param {function} impl the client implementation
 * @param {Client} [target] target of this client, used when wrapping other clients
 * @returns {Client} the client impl with additional methods
 */
module.exports = function client(impl, target) {

	if (target) {

		/**
		 * @returns {Client} the target client
		 */
		impl.skip = function skip() {
			return target;
		};

	}

	/**
	 * Allow a client to easily be wrapped by an interceptor
	 *
	 * @param {Interceptor} interceptor the interceptor to wrap this client with
	 * @param [config] configuration for the interceptor
	 * @returns {Client} the newly wrapped client
	 */
	impl.wrap = function wrap(interceptor, config) {
		return interceptor(impl, config);
	};

	/**
	 * @deprecated
	 */
	impl.chain = function chain() {
		if (typeof console !== 'undefined') {
			console.log('rest.js: client.chain() is deprecated, use client.wrap() instead');
		}

		return impl.wrap.apply(this, arguments);
	};

	return impl;

};

},{}],26:[function(require,module,exports){
/*
 * Copyright 2014-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

/**
 * Plain JS Object containing properties that represent an HTTP request.
 *
 * Depending on the capabilities of the underlying client, a request
 * may be cancelable. If a request may be canceled, the client will add
 * a canceled flag and cancel function to the request object. Canceling
 * the request will put the response into an error state.
 *
 * @field {string} [method='GET'] HTTP method, commonly GET, POST, PUT, DELETE or HEAD
 * @field {string|UrlBuilder} [path=''] path template with optional path variables
 * @field {Object} [params] parameters for the path template and query string
 * @field {Object} [headers] custom HTTP headers to send, in addition to the clients default headers
 * @field [entity] the HTTP entity, common for POST or PUT requests
 * @field {boolean} [canceled] true if the request has been canceled, set by the client
 * @field {Function} [cancel] cancels the request if invoked, provided by the client
 * @field {Client} [originator] the client that first handled this request, provided by the interceptor
 *
 * @class Request
 */

/**
 * Plain JS Object containing properties that represent an HTTP response
 *
 * @field {Object} [request] the request object as received by the root client
 * @field {Object} [raw] the underlying request object, like XmlHttpRequest in a browser
 * @field {number} [status.code] status code of the response (i.e. 200, 404)
 * @field {string} [status.text] status phrase of the response
 * @field {Object] [headers] response headers hash of normalized name, value pairs
 * @field [entity] the response body
 *
 * @class Response
 */

/**
 * HTTP client particularly suited for RESTful operations.
 *
 * @field {function} wrap wraps this client with a new interceptor returning the wrapped client
 *
 * @param {Request} the HTTP request
 * @returns {ResponsePromise<Response>} a promise the resolves to the HTTP response
 *
 * @class Client
 */

 /**
  * Extended when.js Promises/A+ promise with HTTP specific helpers
  *q
  * @method entity promise for the HTTP entity
  * @method status promise for the HTTP status code
  * @method headers promise for the HTTP response headers
  * @method header promise for a specific HTTP response header
  *
  * @class ResponsePromise
  * @extends Promise
  */

var client, target, platformDefault;

client = require('../client');

if (typeof Promise !== 'function' && console && console.log) {
	console.log('An ES6 Promise implementation is required to use rest.js. See https://github.com/cujojs/when/blob/master/docs/es6-promise-shim.md for using when.js as a Promise polyfill.');
}

/**
 * Make a request with the default client
 * @param {Request} the HTTP request
 * @returns {Promise<Response>} a promise the resolves to the HTTP response
 */
function defaultClient() {
	return target.apply(void 0, arguments);
}

/**
 * Change the default client
 * @param {Client} client the new default client
 */
defaultClient.setDefaultClient = function setDefaultClient(client) {
	target = client;
};

/**
 * Obtain a direct reference to the current default client
 * @returns {Client} the default client
 */
defaultClient.getDefaultClient = function getDefaultClient() {
	return target;
};

/**
 * Reset the default client to the platform default
 */
defaultClient.resetDefaultClient = function resetDefaultClient() {
	target = platformDefault;
};

/**
 * @private
 */
defaultClient.setPlatformDefaultClient = function setPlatformDefaultClient(client) {
	if (platformDefault) {
		throw new Error('Unable to redefine platformDefaultClient');
	}
	target = platformDefault = client;
};

module.exports = client(defaultClient);

},{"../client":25}],27:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var normalizeHeaderName, responsePromise, client, headerSplitRE;

normalizeHeaderName = require('../util/normalizeHeaderName');
responsePromise = require('../util/responsePromise');
client = require('../client');

// according to the spec, the line break is '\r\n', but doesn't hold true in practice
headerSplitRE = /[\r|\n]+/;

function parseHeaders(raw) {
	// Note: Set-Cookie will be removed by the browser
	var headers = {};

	if (!raw) { return headers; }

	raw.trim().split(headerSplitRE).forEach(function (header) {
		var boundary, name, value;
		boundary = header.indexOf(':');
		name = normalizeHeaderName(header.substring(0, boundary).trim());
		value = header.substring(boundary + 1).trim();
		if (headers[name]) {
			if (Array.isArray(headers[name])) {
				// add to an existing array
				headers[name].push(value);
			}
			else {
				// convert single value to array
				headers[name] = [headers[name], value];
			}
		}
		else {
			// new, single value
			headers[name] = value;
		}
	});

	return headers;
}

function safeMixin(target, source) {
	Object.keys(source || {}).forEach(function (prop) {
		// make sure the property already exists as
		// IE 6 will blow up if we add a new prop
		if (source.hasOwnProperty(prop) && prop in target) {
			try {
				target[prop] = source[prop];
			}
			catch (e) {
				// ignore, expected for some properties at some points in the request lifecycle
			}
		}
	});

	return target;
}

module.exports = client(function xhr(request) {
	return responsePromise.promise(function (resolve, reject) {
		/*jshint maxcomplexity:20 */

		var client, method, url, headers, entity, headerName, response, XHR;

		request = typeof request === 'string' ? { path: request } : request || {};
		response = { request: request };

		if (request.canceled) {
			response.error = 'precanceled';
			reject(response);
			return;
		}

		XHR = request.engine || XMLHttpRequest;
		if (!XHR) {
			reject({ request: request, error: 'xhr-not-available' });
			return;
		}

		entity = request.entity;
		request.method = request.method || (entity ? 'POST' : 'GET');
		method = request.method;
		url = response.url = request.path || '';

		try {
			client = response.raw = new XHR();

			// mixin extra request properties before and after opening the request as some properties require being set at different phases of the request
			safeMixin(client, request.mixin);
			client.open(method, url, true);
			safeMixin(client, request.mixin);

			headers = request.headers;
			for (headerName in headers) {
				/*jshint forin:false */
				if (headerName === 'Content-Type' && headers[headerName] === 'multipart/form-data') {
					// XMLHttpRequest generates its own Content-Type header with the
					// appropriate multipart boundary when sending multipart/form-data.
					continue;
				}

				client.setRequestHeader(headerName, headers[headerName]);
			}

			request.canceled = false;
			request.cancel = function cancel() {
				request.canceled = true;
				client.abort();
				reject(response);
			};

			client.onreadystatechange = function (/* e */) {
				if (request.canceled) { return; }
				if (client.readyState === (XHR.DONE || 4)) {
					response.status = {
						code: client.status,
						text: client.statusText
					};
					response.headers = parseHeaders(client.getAllResponseHeaders());
					response.entity = client.responseText;

					// #125 -- Sometimes IE8-9 uses 1223 instead of 204
					// http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
					if (response.status.code === 1223) {
						response.status.code = 204;
					}

					if (response.status.code > 0) {
						// check status code as readystatechange fires before error event
						resolve(response);
					}
					else {
						// give the error callback a chance to fire before resolving
						// requests for file:// URLs do not have a status code
						setTimeout(function () {
							resolve(response);
						}, 0);
					}
				}
			};

			try {
				client.onerror = function (/* e */) {
					response.error = 'loaderror';
					reject(response);
				};
			}
			catch (e) {
				// IE 6 will not support error handling
			}

			client.send(entity);
		}
		catch (e) {
			response.error = 'loaderror';
			reject(response);
		}

	});
});

},{"../client":25,"../util/normalizeHeaderName":47,"../util/responsePromise":48}],28:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var defaultClient, mixin, responsePromise, client;

defaultClient = require('./client/default');
mixin = require('./util/mixin');
responsePromise = require('./util/responsePromise');
client = require('./client');

/**
 * Interceptors have the ability to intercept the request and/org response
 * objects.  They may augment, prune, transform or replace the
 * request/response as needed.  Clients may be composed by wrapping
 * together multiple interceptors.
 *
 * Configured interceptors are functional in nature.  Wrapping a client in
 * an interceptor will not affect the client, merely the data that flows in
 * and out of that client.  A common configuration can be created once and
 * shared; specialization can be created by further wrapping that client
 * with custom interceptors.
 *
 * @param {Client} [target] client to wrap
 * @param {Object} [config] configuration for the interceptor, properties will be specific to the interceptor implementation
 * @returns {Client} A client wrapped with the interceptor
 *
 * @class Interceptor
 */

function defaultInitHandler(config) {
	return config;
}

function defaultRequestHandler(request /*, config, meta */) {
	return request;
}

function defaultResponseHandler(response /*, config, meta */) {
	return response;
}

/**
 * Alternate return type for the request handler that allows for more complex interactions.
 *
 * @param properties.request the traditional request return object
 * @param {Promise} [properties.abort] promise that resolves if/when the request is aborted
 * @param {Client} [properties.client] override the defined client with an alternate client
 * @param [properties.response] response for the request, short circuit the request
 */
function ComplexRequest(properties) {
	if (!(this instanceof ComplexRequest)) {
		// in case users forget the 'new' don't mix into the interceptor
		return new ComplexRequest(properties);
	}
	mixin(this, properties);
}

/**
 * Create a new interceptor for the provided handlers.
 *
 * @param {Function} [handlers.init] one time intialization, must return the config object
 * @param {Function} [handlers.request] request handler
 * @param {Function} [handlers.response] response handler regardless of error state
 * @param {Function} [handlers.success] response handler when the request is not in error
 * @param {Function} [handlers.error] response handler when the request is in error, may be used to 'unreject' an error state
 * @param {Function} [handlers.client] the client to use if otherwise not specified, defaults to platform default client
 *
 * @returns {Interceptor}
 */
function interceptor(handlers) {

	var initHandler, requestHandler, successResponseHandler, errorResponseHandler;

	handlers = handlers || {};

	initHandler            = handlers.init    || defaultInitHandler;
	requestHandler         = handlers.request || defaultRequestHandler;
	successResponseHandler = handlers.success || handlers.response || defaultResponseHandler;
	errorResponseHandler   = handlers.error   || function () {
		// Propagate the rejection, with the result of the handler
		return Promise.resolve((handlers.response || defaultResponseHandler).apply(this, arguments))
			.then(Promise.reject.bind(Promise));
	};

	return function (target, config) {

		if (typeof target === 'object') {
			config = target;
		}
		if (typeof target !== 'function') {
			target = handlers.client || defaultClient;
		}

		config = initHandler(config || {});

		function interceptedClient(request) {
			var context, meta;
			context = {};
			meta = { 'arguments': Array.prototype.slice.call(arguments), client: interceptedClient };
			request = typeof request === 'string' ? { path: request } : request || {};
			request.originator = request.originator || interceptedClient;
			return responsePromise(
				requestHandler.call(context, request, config, meta),
				function (request) {
					var response, abort, next;
					next = target;
					if (request instanceof ComplexRequest) {
						// unpack request
						abort = request.abort;
						next = request.client || next;
						response = request.response;
						// normalize request, must be last
						request = request.request;
					}
					response = response || Promise.resolve(request).then(function (request) {
						return Promise.resolve(next(request)).then(
							function (response) {
								return successResponseHandler.call(context, response, config, meta);
							},
							function (response) {
								return errorResponseHandler.call(context, response, config, meta);
							}
						);
					});
					return abort ? Promise.race([response, abort]) : response;
				},
				function (error) {
					return Promise.reject({ request: request, error: error });
				}
			);
		}

		return client(interceptedClient, target);
	};
}

interceptor.ComplexRequest = ComplexRequest;

module.exports = interceptor;

},{"./client":25,"./client/default":26,"./util/mixin":46,"./util/responsePromise":48}],29:[function(require,module,exports){
/*
 * Copyright 2013-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var interceptor, mixinUtil, defaulter;

interceptor = require('../interceptor');
mixinUtil = require('../util/mixin');

defaulter = (function () {

	function mixin(prop, target, defaults) {
		if (prop in target || prop in defaults) {
			target[prop] = mixinUtil({}, defaults[prop], target[prop]);
		}
	}

	function copy(prop, target, defaults) {
		if (prop in defaults && !(prop in target)) {
			target[prop] = defaults[prop];
		}
	}

	var mappings = {
		method: copy,
		path: copy,
		params: mixin,
		headers: mixin,
		entity: copy,
		mixin: mixin
	};

	return function (target, defaults) {
		for (var prop in mappings) {
			/*jshint forin: false */
			mappings[prop](prop, target, defaults);
		}
		return target;
	};

}());

/**
 * Provide default values for a request. These values will be applied to the
 * request if the request object does not already contain an explicit value.
 *
 * For 'params', 'headers', and 'mixin', individual values are mixed in with the
 * request's values. The result is a new object representiing the combined
 * request and config values. Neither input object is mutated.
 *
 * @param {Client} [client] client to wrap
 * @param {string} [config.method] the default method
 * @param {string} [config.path] the default path
 * @param {Object} [config.params] the default params, mixed with the request's existing params
 * @param {Object} [config.headers] the default headers, mixed with the request's existing headers
 * @param {Object} [config.mixin] the default "mixins" (http/https options), mixed with the request's existing "mixins"
 *
 * @returns {Client}
 */
module.exports = interceptor({
	request: function handleRequest(request, config) {
		return defaulter(request, config);
	}
});

},{"../interceptor":28,"../util/mixin":46}],30:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var interceptor;

interceptor = require('../interceptor');

/**
 * Rejects the response promise based on the status code.
 *
 * Codes greater than or equal to the provided value are rejected.  Default
 * value 400.
 *
 * @param {Client} [client] client to wrap
 * @param {number} [config.code=400] code to indicate a rejection
 *
 * @returns {Client}
 */
module.exports = interceptor({
	init: function (config) {
		config.code = config.code || 400;
		return config;
	},
	response: function (response, config) {
		if (response.status && response.status.code >= config.code) {
			return Promise.reject(response);
		}
		return response;
	}
});

},{"../interceptor":28}],31:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var interceptor, mime, registry, noopConverter, missingConverter, attempt;

interceptor = require('../interceptor');
mime = require('../mime');
registry = require('../mime/registry');
attempt = require('../util/attempt');

noopConverter = {
	read: function (obj) { return obj; },
	write: function (obj) { return obj; }
};

missingConverter = {
	read: function () { throw 'No read method found on converter'; },
	write: function () { throw 'No write method found on converter'; }
};

/**
 * MIME type support for request and response entities.  Entities are
 * (de)serialized using the converter for the MIME type.
 *
 * Request entities are converted using the desired converter and the
 * 'Accept' request header prefers this MIME.
 *
 * Response entities are converted based on the Content-Type response header.
 *
 * @param {Client} [client] client to wrap
 * @param {string} [config.mime='text/plain'] MIME type to encode the request
 *   entity
 * @param {string} [config.accept] Accept header for the request
 * @param {Client} [config.client=<request.originator>] client passed to the
 *   converter, defaults to the client originating the request
 * @param {Registry} [config.registry] MIME registry, defaults to the root
 *   registry
 * @param {boolean} [config.permissive] Allow an unkown request MIME type
 *
 * @returns {Client}
 */
module.exports = interceptor({
	init: function (config) {
		config.registry = config.registry || registry;
		return config;
	},
	request: function (request, config) {
		var type, headers;

		headers = request.headers || (request.headers = {});
		type = mime.parse(headers['Content-Type'] || config.mime || 'text/plain');
		headers.Accept = headers.Accept || config.accept || type.raw + ', application/json;q=0.8, text/plain;q=0.5, */*;q=0.2';

		if (!('entity' in request)) {
			return request;
		}

		headers['Content-Type'] = type.raw;

		return config.registry.lookup(type)['catch'](function () {
			// failed to resolve converter
			if (config.permissive) {
				return noopConverter;
			}
			throw 'mime-unknown';
		}).then(function (converter) {
			var client = config.client || request.originator,
				write = converter.write || missingConverter.write;

			return attempt(write.bind(void 0, request.entity, { client: client, request: request, mime: type, registry: config.registry }))
				['catch'](function() {
					throw 'mime-serialization';
				})
				.then(function(entity) {
					request.entity = entity;
					return request;
				});
		});
	},
	response: function (response, config) {
		if (!(response.headers && response.headers['Content-Type'] && response.entity)) {
			return response;
		}

		var type = mime.parse(response.headers['Content-Type']);

		return config.registry.lookup(type)['catch'](function () { return noopConverter; }).then(function (converter) {
			var client = config.client || response.request && response.request.originator,
				read = converter.read || missingConverter.read;

			return attempt(read.bind(void 0, response.entity, { client: client, response: response, mime: type, registry: config.registry }))
				['catch'](function (e) {
					response.error = 'mime-deserialization';
					response.cause = e;
					throw response;
				})
				.then(function (entity) {
					response.entity = entity;
					return response;
				});
		});
	}
});

},{"../interceptor":28,"../mime":35,"../mime/registry":36,"../util/attempt":42}],32:[function(require,module,exports){
/*
 * Copyright 2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var interceptor, UrlBuilder;

interceptor = require('../interceptor');
UrlBuilder = require('../UrlBuilder');

/**
 * Applies request params to the path by token replacement
 *
 * Params not applied as a token are appended to the query string. Params
 * are removed from the request object, as they have been consumed.
 *
 * @deprecated The template interceptor `rest/interceptor/template` is a
 * much richer way to apply paramters to a template. This interceptor is
 * available as a bridge to users who previousled depended on this
 * functionality being available directly on clients.
 *
 * @param {Client} [client] client to wrap
 * @param {Object} [config.params] default param values
 *
 * @returns {Client}
 */
module.exports = interceptor({
	init: function (config) {
		config.params = config.params || {};
		return config;
	},
	request: function (request, config) {
		var path, params;

		path = request.path || '';
		params = request.params || {};

		request.path = new UrlBuilder(path, config.params).append('', params).build();
		delete request.params;

		return request;
	}
});

},{"../UrlBuilder":23,"../interceptor":28}],33:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var interceptor, UrlBuilder;

interceptor = require('../interceptor');
UrlBuilder = require('../UrlBuilder');

function startsWith(str, prefix) {
	return str.indexOf(prefix) === 0;
}

function endsWith(str, suffix) {
	return str.lastIndexOf(suffix) + suffix.length === str.length;
}

/**
 * Prefixes the request path with a common value.
 *
 * @param {Client} [client] client to wrap
 * @param {number} [config.prefix] path prefix
 *
 * @returns {Client}
 */
module.exports = interceptor({
	request: function (request, config) {
		var path;

		if (config.prefix && !(new UrlBuilder(request.path).isFullyQualified())) {
			path = config.prefix;
			if (request.path) {
				if (!endsWith(path, '/') && !startsWith(request.path, '/')) {
					// add missing '/' between path sections
					path += '/';
				}
				path += request.path;
			}
			request.path = path;
		}

		return request;
	}
});

},{"../UrlBuilder":23,"../interceptor":28}],34:[function(require,module,exports){
/*
 * Copyright 2015-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var interceptor, uriTemplate, mixin;

interceptor = require('../interceptor');
uriTemplate = require('../util/uriTemplate');
mixin = require('../util/mixin');

/**
 * Applies request params to the path as a URI Template
 *
 * Params are removed from the request object, as they have been consumed.
 *
 * @see https://tools.ietf.org/html/rfc6570
 *
 * @param {Client} [client] client to wrap
 * @param {Object} [config.params] default param values
 * @param {string} [config.template] default template
 *
 * @returns {Client}
 */
module.exports = interceptor({
	init: function (config) {
		config.params = config.params || {};
		config.template = config.template || '';
		return config;
	},
	request: function (request, config) {
		var template, params;

		template = request.path || config.template;
		params = mixin({}, request.params, config.params);

		request.path = uriTemplate.expand(template, params);
		delete request.params;

		return request;
	}
});

},{"../interceptor":28,"../util/mixin":46,"../util/uriTemplate":50}],35:[function(require,module,exports){
/*
* Copyright 2014-2016 the original author or authors
* @license MIT, see LICENSE.txt for details
*
* @author Scott Andrews
*/

'use strict';

/**
 * Parse a MIME type into it's constituent parts
 *
 * @param {string} mime MIME type to parse
 * @return {{
 *   {string} raw the original MIME type
 *   {string} type the type and subtype
 *   {string} [suffix] mime suffix, including the plus, if any
 *   {Object} params key/value pair of attributes
 * }}
 */
function parse(mime) {
	var params, type;

	params = mime.split(';');
	type = params[0].trim().split('+');

	return {
		raw: mime,
		type: type[0],
		suffix: type[1] ? '+' + type[1] : '',
		params: params.slice(1).reduce(function (params, pair) {
			pair = pair.split('=');
			params[pair[0].trim()] = pair[1] ? pair[1].trim() : void 0;
			return params;
		}, {})
	};
}

module.exports = {
	parse: parse
};

},{}],36:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var mime, registry;

mime = require('../mime');

function Registry(mimes) {

	/**
	 * Lookup the converter for a MIME type
	 *
	 * @param {string} type the MIME type
	 * @return a promise for the converter
	 */
	this.lookup = function lookup(type) {
		var parsed;

		parsed = typeof type === 'string' ? mime.parse(type) : type;

		if (mimes[parsed.raw]) {
			return mimes[parsed.raw];
		}
		if (mimes[parsed.type + parsed.suffix]) {
			return mimes[parsed.type + parsed.suffix];
		}
		if (mimes[parsed.type]) {
			return mimes[parsed.type];
		}
		if (mimes[parsed.suffix]) {
			return mimes[parsed.suffix];
		}

		return Promise.reject(new Error('Unable to locate converter for mime "' + parsed.raw + '"'));
	};

	/**
	 * Create a late dispatched proxy to the target converter.
	 *
	 * Common when a converter is registered under multiple names and
	 * should be kept in sync if updated.
	 *
	 * @param {string} type mime converter to dispatch to
	 * @returns converter whose read/write methods target the desired mime converter
	 */
	this.delegate = function delegate(type) {
		return {
			read: function () {
				var args = arguments;
				return this.lookup(type).then(function (converter) {
					return converter.read.apply(this, args);
				}.bind(this));
			}.bind(this),
			write: function () {
				var args = arguments;
				return this.lookup(type).then(function (converter) {
					return converter.write.apply(this, args);
				}.bind(this));
			}.bind(this)
		};
	};

	/**
	 * Register a custom converter for a MIME type
	 *
	 * @param {string} type the MIME type
	 * @param converter the converter for the MIME type
	 * @return a promise for the converter
	 */
	this.register = function register(type, converter) {
		mimes[type] = Promise.resolve(converter);
		return mimes[type];
	};

	/**
	 * Create a child registry whoes registered converters remain local, while
	 * able to lookup converters from its parent.
	 *
	 * @returns child MIME registry
	 */
	this.child = function child() {
		return new Registry(Object.create(mimes));
	};

}

registry = new Registry({});

// include provided serializers
registry.register('application/hal', require('./type/application/hal'));
registry.register('application/json', require('./type/application/json'));
registry.register('application/x-www-form-urlencoded', require('./type/application/x-www-form-urlencoded'));
registry.register('multipart/form-data', require('./type/multipart/form-data'));
registry.register('text/plain', require('./type/text/plain'));

registry.register('+json', registry.delegate('application/json'));

module.exports = registry;

},{"../mime":35,"./type/application/hal":37,"./type/application/json":38,"./type/application/x-www-form-urlencoded":39,"./type/multipart/form-data":40,"./type/text/plain":41}],37:[function(require,module,exports){
/*
 * Copyright 2013-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var pathPrefix, template, find, lazyPromise, responsePromise;

pathPrefix = require('../../../interceptor/pathPrefix');
template = require('../../../interceptor/template');
find = require('../../../util/find');
lazyPromise = require('../../../util/lazyPromise');
responsePromise = require('../../../util/responsePromise');

function defineProperty(obj, name, value) {
	Object.defineProperty(obj, name, {
		value: value,
		configurable: true,
		enumerable: false,
		writeable: true
	});
}

/**
 * Hypertext Application Language serializer
 *
 * Implemented to https://tools.ietf.org/html/draft-kelly-json-hal-06
 *
 * As the spec is still a draft, this implementation will be updated as the
 * spec evolves
 *
 * Objects are read as HAL indexing links and embedded objects on to the
 * resource. Objects are written as plain JSON.
 *
 * Embedded relationships are indexed onto the resource by the relationship
 * as a promise for the related resource.
 *
 * Links are indexed onto the resource as a lazy promise that will GET the
 * resource when a handler is first registered on the promise.
 *
 * A `requestFor` method is added to the entity to make a request for the
 * relationship.
 *
 * A `clientFor` method is added to the entity to get a full Client for a
 * relationship.
 *
 * The `_links` and `_embedded` properties on the resource are made
 * non-enumerable.
 */
module.exports = {

	read: function (str, opts) {
		var client, console;

		opts = opts || {};
		client = opts.client;
		console = opts.console || console;

		function deprecationWarning(relationship, deprecation) {
			if (deprecation && console && console.warn || console.log) {
				(console.warn || console.log).call(console, 'Relationship \'' + relationship + '\' is deprecated, see ' + deprecation);
			}
		}

		return opts.registry.lookup(opts.mime.suffix).then(function (converter) {
			return converter.read(str, opts);
		}).then(function (root) {
			find.findProperties(root, '_embedded', function (embedded, resource, name) {
				Object.keys(embedded).forEach(function (relationship) {
					if (relationship in resource) { return; }
					var related = responsePromise({
						entity: embedded[relationship]
					});
					defineProperty(resource, relationship, related);
				});
				defineProperty(resource, name, embedded);
			});
			find.findProperties(root, '_links', function (links, resource, name) {
				Object.keys(links).forEach(function (relationship) {
					var link = links[relationship];
					if (relationship in resource) { return; }
					defineProperty(resource, relationship, responsePromise.make(lazyPromise(function () {
						if (link.deprecation) { deprecationWarning(relationship, link.deprecation); }
						if (link.templated === true) {
							return template(client)({ path: link.href });
						}
						return client({ path: link.href });
					})));
				});
				defineProperty(resource, name, links);
				defineProperty(resource, 'clientFor', function (relationship, clientOverride) {
					var link = links[relationship];
					if (!link) {
						throw new Error('Unknown relationship: ' + relationship);
					}
					if (link.deprecation) { deprecationWarning(relationship, link.deprecation); }
					if (link.templated === true) {
						return template(
							clientOverride || client,
							{ template: link.href }
						);
					}
					return pathPrefix(
						clientOverride || client,
						{ prefix: link.href }
					);
				});
				defineProperty(resource, 'requestFor', function (relationship, request, clientOverride) {
					var client = this.clientFor(relationship, clientOverride);
					return client(request);
				});
			});

			return root;
		});

	},

	write: function (obj, opts) {
		return opts.registry.lookup(opts.mime.suffix).then(function (converter) {
			return converter.write(obj, opts);
		});
	}

};

},{"../../../interceptor/pathPrefix":33,"../../../interceptor/template":34,"../../../util/find":44,"../../../util/lazyPromise":45,"../../../util/responsePromise":48}],38:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

/**
 * Create a new JSON converter with custom reviver/replacer.
 *
 * The extended converter must be published to a MIME registry in order
 * to be used. The existing converter will not be modified.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
 *
 * @param {function} [reviver=undefined] custom JSON.parse reviver
 * @param {function|Array} [replacer=undefined] custom JSON.stringify replacer
 */
function createConverter(reviver, replacer) {
	return {

		read: function (str) {
			return JSON.parse(str, reviver);
		},

		write: function (obj) {
			return JSON.stringify(obj, replacer);
		},

		extend: createConverter

	};
}

module.exports = createConverter();

},{}],39:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var encodedSpaceRE, urlEncodedSpaceRE;

encodedSpaceRE = /%20/g;
urlEncodedSpaceRE = /\+/g;

function urlEncode(str) {
	str = encodeURIComponent(str);
	// spec says space should be encoded as '+'
	return str.replace(encodedSpaceRE, '+');
}

function urlDecode(str) {
	// spec says space should be encoded as '+'
	str = str.replace(urlEncodedSpaceRE, ' ');
	return decodeURIComponent(str);
}

function append(str, name, value) {
	if (Array.isArray(value)) {
		value.forEach(function (value) {
			str = append(str, name, value);
		});
	}
	else {
		if (str.length > 0) {
			str += '&';
		}
		str += urlEncode(name);
		if (value !== undefined && value !== null) {
			str += '=' + urlEncode(value);
		}
	}
	return str;
}

module.exports = {

	read: function (str) {
		var obj = {};
		str.split('&').forEach(function (entry) {
			var pair, name, value;
			pair = entry.split('=');
			name = urlDecode(pair[0]);
			if (pair.length === 2) {
				value = urlDecode(pair[1]);
			}
			else {
				value = null;
			}
			if (name in obj) {
				if (!Array.isArray(obj[name])) {
					// convert to an array, perserving currnent value
					obj[name] = [obj[name]];
				}
				obj[name].push(value);
			}
			else {
				obj[name] = value;
			}
		});
		return obj;
	},

	write: function (obj) {
		var str = '';
		Object.keys(obj).forEach(function (name) {
			str = append(str, name, obj[name]);
		});
		return str;
	}

};

},{}],40:[function(require,module,exports){
/*
 * Copyright 2014-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Michael Jackson
 */

/* global FormData, File, Blob */

'use strict';

function isFormElement(object) {
	return object &&
		object.nodeType === 1 && // Node.ELEMENT_NODE
		object.tagName === 'FORM';
}

function createFormDataFromObject(object) {
	var formData = new FormData();

	var value;
	for (var property in object) {
		if (object.hasOwnProperty(property)) {
			value = object[property];

			if (value instanceof File) {
				formData.append(property, value, value.name);
			} else if (value instanceof Blob) {
				formData.append(property, value);
			} else {
				formData.append(property, String(value));
			}
		}
	}

	return formData;
}

module.exports = {

	write: function (object) {
		if (typeof FormData === 'undefined') {
			throw new Error('The multipart/form-data mime serializer requires FormData support');
		}

		// Support FormData directly.
		if (object instanceof FormData) {
			return object;
		}

		// Support <form> elements.
		if (isFormElement(object)) {
			return new FormData(object);
		}

		// Support plain objects, may contain File/Blob as value.
		if (typeof object === 'object' && object !== null) {
			return createFormDataFromObject(object);
		}

		throw new Error('Unable to create FormData from object ' + object);
	}

};

},{}],41:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

module.exports = {

	read: function (str) {
		return str;
	},

	write: function (obj) {
		return obj.toString();
	}

};

},{}],42:[function(require,module,exports){
/*
 * Copyright 2015-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

/**
 * Attempt to invoke a function capturing the resulting value as a Promise
 *
 * If the method throws, the caught value used to reject the Promise.
 *
 * @param {function} work function to invoke
 * @returns {Promise} Promise for the output of the work function
 */
function attempt(work) {
	try {
		return Promise.resolve(work());
	}
	catch (e) {
		return Promise.reject(e);
	}
}

module.exports = attempt;

},{}],43:[function(require,module,exports){
/*
 * Copyright (c) 2009 Nicholas C. Zakas. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*
 * Base 64 implementation in JavaScript
 * Original source available at https://raw.github.com/nzakas/computer-science-in-javascript/02a2745b4aa8214f2cae1bf0b15b447ca1a91b23/encodings/base64/base64.js
 *
 * Linter refinement by Scott Andrews
 */

'use strict';

/*jshint bitwise: false */

var digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Base64-encodes a string of text.
 *
 * @param {string} text The text to encode.
 * @return {string} The base64-encoded string.
 */
function base64Encode(text) {

	if (/([^\u0000-\u00ff])/.test(text)) {
		throw new Error('Can\'t base64 encode non-ASCII characters.');
	}

	var i = 0,
		cur, prev, byteNum,
		result = [];

	while (i < text.length) {

		cur = text.charCodeAt(i);
		byteNum = i % 3;

		switch (byteNum) {
		case 0: //first byte
			result.push(digits.charAt(cur >> 2));
			break;

		case 1: //second byte
			result.push(digits.charAt((prev & 3) << 4 | (cur >> 4)));
			break;

		case 2: //third byte
			result.push(digits.charAt((prev & 0x0f) << 2 | (cur >> 6)));
			result.push(digits.charAt(cur & 0x3f));
			break;
		}

		prev = cur;
		i += 1;
	}

	if (byteNum === 0) {
		result.push(digits.charAt((prev & 3) << 4));
		result.push('==');
	} else if (byteNum === 1) {
		result.push(digits.charAt((prev & 0x0f) << 2));
		result.push('=');
	}

	return result.join('');
}

/**
 * Base64-decodes a string of text.
 *
 * @param {string} text The text to decode.
 * @return {string} The base64-decoded string.
 */
function base64Decode(text) {

	//ignore white space
	text = text.replace(/\s/g, '');

	//first check for any unexpected input
	if (!(/^[a-z0-9\+\/\s]+\={0,2}$/i.test(text)) || text.length % 4 > 0) {
		throw new Error('Not a base64-encoded string.');
	}

	//local variables
	var cur, prev, digitNum,
		i = 0,
		result = [];

	//remove any equals signs
	text = text.replace(/\=/g, '');

	//loop over each character
	while (i < text.length) {

		cur = digits.indexOf(text.charAt(i));
		digitNum = i % 4;

		switch (digitNum) {

		//case 0: first digit - do nothing, not enough info to work with

		case 1: //second digit
			result.push(String.fromCharCode(prev << 2 | cur >> 4));
			break;

		case 2: //third digit
			result.push(String.fromCharCode((prev & 0x0f) << 4 | cur >> 2));
			break;

		case 3: //fourth digit
			result.push(String.fromCharCode((prev & 3) << 6 | cur));
			break;
		}

		prev = cur;
		i += 1;
	}

	//return a string
	return result.join('');

}

module.exports = {
	encode: base64Encode,
	decode: base64Decode
};

},{}],44:[function(require,module,exports){
/*
 * Copyright 2013-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

module.exports = {

	/**
	 * Find objects within a graph the contain a property of a certain name.
	 *
	 * NOTE: this method will not discover object graph cycles.
	 *
	 * @param {*} obj object to search on
	 * @param {string} prop name of the property to search for
	 * @param {Function} callback function to receive the found properties and their parent
	 */
	findProperties: function findProperties(obj, prop, callback) {
		if (typeof obj !== 'object' || obj === null) { return; }
		if (prop in obj) {
			callback(obj[prop], obj, prop);
		}
		Object.keys(obj).forEach(function (key) {
			findProperties(obj[key], prop, callback);
		});
	}

};

},{}],45:[function(require,module,exports){
/*
 * Copyright 2013-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var attempt = require('./attempt');

/**
 * Create a promise whose work is started only when a handler is registered.
 *
 * The work function will be invoked at most once. Thrown values will result
 * in promise rejection.
 *
 * @param {Function} work function whose ouput is used to resolve the
 *   returned promise.
 * @returns {Promise} a lazy promise
 */
function lazyPromise(work) {
	var started, resolver, promise, then;

	started = false;

	promise = new Promise(function (resolve, reject) {
		resolver = {
			resolve: resolve,
			reject: reject
		};
	});
	then = promise.then;

	promise.then = function () {
		if (!started) {
			started = true;
			attempt(work).then(resolver.resolve, resolver.reject);
		}
		return then.apply(promise, arguments);
	};

	return promise;
}

module.exports = lazyPromise;

},{"./attempt":42}],46:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var empty = {};

/**
 * Mix the properties from the source object into the destination object.
 * When the same property occurs in more then one object, the right most
 * value wins.
 *
 * @param {Object} dest the object to copy properties to
 * @param {Object} sources the objects to copy properties from.  May be 1 to N arguments, but not an Array.
 * @return {Object} the destination object
 */
function mixin(dest /*, sources... */) {
	var i, l, source, name;

	if (!dest) { dest = {}; }
	for (i = 1, l = arguments.length; i < l; i += 1) {
		source = arguments[i];
		for (name in source) {
			if (!(name in dest) || (dest[name] !== source[name] && (!(name in empty) || empty[name] !== source[name]))) {
				dest[name] = source[name];
			}
		}
	}

	return dest; // Object
}

module.exports = mixin;

},{}],47:[function(require,module,exports){
/*
 * Copyright 2012-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

/**
 * Normalize HTTP header names using the pseudo camel case.
 *
 * For example:
 *   content-type         -> Content-Type
 *   accepts              -> Accepts
 *   x-custom-header-name -> X-Custom-Header-Name
 *
 * @param {string} name the raw header name
 * @return {string} the normalized header name
 */
function normalizeHeaderName(name) {
	return name.toLowerCase()
		.split('-')
		.map(function (chunk) { return chunk.charAt(0).toUpperCase() + chunk.slice(1); })
		.join('-');
}

module.exports = normalizeHeaderName;

},{}],48:[function(require,module,exports){
/*
 * Copyright 2014-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

/*jshint latedef: nofunc */

var normalizeHeaderName = require('./normalizeHeaderName');

function property(promise, name) {
	return promise.then(
		function (value) {
			return value && value[name];
		},
		function (value) {
			return Promise.reject(value && value[name]);
		}
	);
}

/**
 * Obtain the response entity
 *
 * @returns {Promise} for the response entity
 */
function entity() {
	/*jshint validthis:true */
	return property(this, 'entity');
}

/**
 * Obtain the response status
 *
 * @returns {Promise} for the response status
 */
function status() {
	/*jshint validthis:true */
	return property(property(this, 'status'), 'code');
}

/**
 * Obtain the response headers map
 *
 * @returns {Promise} for the response headers map
 */
function headers() {
	/*jshint validthis:true */
	return property(this, 'headers');
}

/**
 * Obtain a specific response header
 *
 * @param {String} headerName the header to retrieve
 * @returns {Promise} for the response header's value
 */
function header(headerName) {
	/*jshint validthis:true */
	headerName = normalizeHeaderName(headerName);
	return property(this.headers(), headerName);
}

/**
 * Follow a related resource
 *
 * The relationship to follow may be define as a plain string, an object
 * with the rel and params, or an array containing one or more entries
 * with the previous forms.
 *
 * Examples:
 *   response.follow('next')
 *
 *   response.follow({ rel: 'next', params: { pageSize: 100 } })
 *
 *   response.follow([
 *       { rel: 'items', params: { projection: 'noImages' } },
 *       'search',
 *       { rel: 'findByGalleryIsNull', params: { projection: 'noImages' } },
 *       'items'
 *   ])
 *
 * @param {String|Object|Array} rels one, or more, relationships to follow
 * @returns ResponsePromise<Response> related resource
 */
function follow(rels) {
	/*jshint validthis:true */
	rels = [].concat(rels);

	return make(rels.reduce(function (response, rel) {
		return response.then(function (response) {
			if (typeof rel === 'string') {
				rel = { rel: rel };
			}
			if (typeof response.entity.clientFor !== 'function') {
				throw new Error('Hypermedia response expected');
			}
			var client = response.entity.clientFor(rel.rel);
			return client({ params: rel.params });
		});
	}, this));
}

/**
 * Wrap a Promise as an ResponsePromise
 *
 * @param {Promise<Response>} promise the promise for an HTTP Response
 * @returns {ResponsePromise<Response>} wrapped promise for Response with additional helper methods
 */
function make(promise) {
	promise.status = status;
	promise.headers = headers;
	promise.header = header;
	promise.entity = entity;
	promise.follow = follow;
	return promise;
}

function responsePromise(obj, callback, errback) {
	return make(Promise.resolve(obj).then(callback, errback));
}

responsePromise.make = make;
responsePromise.reject = function (val) {
	return make(Promise.reject(val));
};
responsePromise.promise = function (func) {
	return make(new Promise(func));
};

module.exports = responsePromise;

},{"./normalizeHeaderName":47}],49:[function(require,module,exports){
/*
 * Copyright 2015-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var charMap;

charMap = (function () {
	var strings = {
		alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		digit: '0123456789'
	};

	strings.genDelims = ':/?#[]@';
	strings.subDelims = '!$&\'()*+,;=';
	strings.reserved = strings.genDelims + strings.subDelims;
	strings.unreserved = strings.alpha + strings.digit + '-._~';
	strings.url = strings.reserved + strings.unreserved;
	strings.scheme = strings.alpha + strings.digit + '+-.';
	strings.userinfo = strings.unreserved + strings.subDelims + ':';
	strings.host = strings.unreserved + strings.subDelims;
	strings.port = strings.digit;
	strings.pchar = strings.unreserved + strings.subDelims + ':@';
	strings.segment = strings.pchar;
	strings.path = strings.segment + '/';
	strings.query = strings.pchar + '/?';
	strings.fragment = strings.pchar + '/?';

	return Object.keys(strings).reduce(function (charMap, set) {
		charMap[set] = strings[set].split('').reduce(function (chars, myChar) {
			chars[myChar] = true;
			return chars;
		}, {});
		return charMap;
	}, {});
}());

function encode(str, allowed) {
	if (typeof str !== 'string') {
		throw new Error('String required for URL encoding');
	}
	return str.split('').map(function (myChar) {
		if (allowed.hasOwnProperty(myChar)) {
			return myChar;
		}
		var code = myChar.charCodeAt(0);
		if (code <= 127) {
			var encoded = code.toString(16).toUpperCase();
 			return '%' + (encoded.length % 2 === 1 ? '0' : '') + encoded;
		}
		else {
			return encodeURIComponent(myChar).toUpperCase();
		}
	}).join('');
}

function makeEncoder(allowed) {
	allowed = allowed || charMap.unreserved;
	return function (str) {
		return encode(str, allowed);
	};
}

function decode(str) {
	return decodeURIComponent(str);
}

module.exports = {

	/*
	 * Decode URL encoded strings
	 *
	 * @param {string} URL encoded string
	 * @returns {string} URL decoded string
	 */
	decode: decode,

	/*
	 * URL encode a string
	 *
	 * All but alpha-numerics and a very limited set of punctuation - . _ ~ are
	 * encoded.
	 *
	 * @param {string} string to encode
	 * @returns {string} URL encoded string
	 */
	encode: makeEncoder(),

	/*
	* URL encode a URL
	*
	* All character permitted anywhere in a URL are left unencoded even
	* if that character is not permitted in that portion of a URL.
	*
	* Note: This method is typically not what you want.
	*
	* @param {string} string to encode
	* @returns {string} URL encoded string
	*/
	encodeURL: makeEncoder(charMap.url),

	/*
	 * URL encode the scheme portion of a URL
	 *
	 * @param {string} string to encode
	 * @returns {string} URL encoded string
	 */
	encodeScheme: makeEncoder(charMap.scheme),

	/*
	 * URL encode the user info portion of a URL
	 *
	 * @param {string} string to encode
	 * @returns {string} URL encoded string
	 */
	encodeUserInfo: makeEncoder(charMap.userinfo),

	/*
	 * URL encode the host portion of a URL
	 *
	 * @param {string} string to encode
	 * @returns {string} URL encoded string
	 */
	encodeHost: makeEncoder(charMap.host),

	/*
	 * URL encode the port portion of a URL
	 *
	 * @param {string} string to encode
	 * @returns {string} URL encoded string
	 */
	encodePort: makeEncoder(charMap.port),

	/*
	 * URL encode a path segment portion of a URL
	 *
	 * @param {string} string to encode
	 * @returns {string} URL encoded string
	 */
	encodePathSegment: makeEncoder(charMap.segment),

	/*
	 * URL encode the path portion of a URL
	 *
	 * @param {string} string to encode
	 * @returns {string} URL encoded string
	 */
	encodePath: makeEncoder(charMap.path),

	/*
	 * URL encode the query portion of a URL
	 *
	 * @param {string} string to encode
	 * @returns {string} URL encoded string
	 */
	encodeQuery: makeEncoder(charMap.query),

	/*
	 * URL encode the fragment portion of a URL
	 *
	 * @param {string} string to encode
	 * @returns {string} URL encoded string
	 */
	encodeFragment: makeEncoder(charMap.fragment)

};

},{}],50:[function(require,module,exports){
/*
 * Copyright 2015-2016 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

'use strict';

var uriEncoder, operations, prefixRE;

uriEncoder = require('./uriEncoder');

prefixRE = /^([^:]*):([0-9]+)$/;
operations = {
	'':  { first: '',  separator: ',', named: false, empty: '',  encoder: uriEncoder.encode },
	'+': { first: '',  separator: ',', named: false, empty: '',  encoder: uriEncoder.encodeURL },
	'#': { first: '#', separator: ',', named: false, empty: '',  encoder: uriEncoder.encodeURL },
	'.': { first: '.', separator: '.', named: false, empty: '',  encoder: uriEncoder.encode },
	'/': { first: '/', separator: '/', named: false, empty: '',  encoder: uriEncoder.encode },
	';': { first: ';', separator: ';', named: true,  empty: '',  encoder: uriEncoder.encode },
	'?': { first: '?', separator: '&', named: true,  empty: '=', encoder: uriEncoder.encode },
	'&': { first: '&', separator: '&', named: true,  empty: '=', encoder: uriEncoder.encode },
	'=': { reserved: true },
	',': { reserved: true },
	'!': { reserved: true },
	'@': { reserved: true },
	'|': { reserved: true }
};

function apply(operation, expression, params) {
	/*jshint maxcomplexity:11 */
	return expression.split(',').reduce(function (result, variable) {
		var opts, value;

		opts = {};
		if (variable.slice(-1) === '*') {
			variable = variable.slice(0, -1);
			opts.explode = true;
		}
		if (prefixRE.test(variable)) {
			var prefix = prefixRE.exec(variable);
			variable = prefix[1];
			opts.maxLength = parseInt(prefix[2]);
		}

		variable = uriEncoder.decode(variable);
		value = params[variable];

		if (value === void 0 || value === null) {
			return result;
		}
		if (Array.isArray(value)) {
			result = value.reduce(function (result, value) {
				if (result.length) {
					result += opts.explode ? operation.separator : ',';
					if (operation.named && opts.explode) {
						result += operation.encoder(variable);
						result += value.length ? '=' : operation.empty;
					}
				}
				else {
					result += operation.first;
					if (operation.named) {
						result += operation.encoder(variable);
						result += value.length ? '=' : operation.empty;
					}
				}
				result += operation.encoder(value);
				return result;
			}, result);
		}
		else if (typeof value === 'object') {
			result = Object.keys(value).reduce(function (result, name) {
				if (result.length) {
					result += opts.explode ? operation.separator : ',';
				}
				else {
					result += operation.first;
					if (operation.named && !opts.explode) {
						result += operation.encoder(variable);
						result += value[name].length ? '=' : operation.empty;
					}
				}
				result += operation.encoder(name);
				result += opts.explode ? '=' : ',';
				result += operation.encoder(value[name]);
				return result;
			}, result);
		}
		else {
			value = String(value);
			if (opts.maxLength) {
				value = value.slice(0, opts.maxLength);
			}
			result += result.length ? operation.separator : operation.first;
			if (operation.named) {
				result += operation.encoder(variable);
				result += value.length ? '=' : operation.empty;
			}
			result += operation.encoder(value);
		}

		return result;
	}, '');
}

function expandExpression(expression, params) {
	var operation;

	operation = operations[expression.slice(0,1)];
	if (operation) {
		expression = expression.slice(1);
	}
	else {
		operation = operations[''];
	}

	if (operation.reserved) {
		throw new Error('Reserved expression operations are not supported');
	}

	return apply(operation, expression, params);
}

function expandTemplate(template, params) {
	var start, end, uri;

	uri = '';
	end = 0;
	while (true) {
		start = template.indexOf('{', end);
		if (start === -1) {
			// no more expressions
			uri += template.slice(end);
			break;
		}
		uri += template.slice(end, start);
		end = template.indexOf('}', start) + 1;
		uri += expandExpression(template.slice(start + 1, end - 1), params);
	}

	return uri;
}

module.exports = {

	/**
	 * Expand a URI Template with parameters to form a URI.
	 *
	 * Full implementation (level 4) of rfc6570.
	 * @see https://tools.ietf.org/html/rfc6570
	 *
	 * @param {string} template URI template
	 * @param {Object} [params] params to apply to the template durring expantion
	 * @returns {string} expanded URI
	 */
	expand: expandTemplate

};

},{"./uriEncoder":49}],51:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1]);
