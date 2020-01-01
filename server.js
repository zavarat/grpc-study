"use strict";

const parseArgs = require("minimist");
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");

const PROTO_PATH = path.join(__dirname, "proto", "route.proto"); //    path.resolve("proto", "route.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const routeguide = grpc.loadPackageDefinition(packageDefinition).routeguide;
const COORD_FACTOR = 1e7;
let feature_list = new Array();

function checkFeature(point) {
  let feature;
  for (let i = 0; i < feature_list.length; ++i) {
    feature = feature_list[i];
    if (
      feature.location.latitude === point.latitude &&
      feature.location.longitude === point.longitude
    ) {
      return feature;
    }
  }

  return {
    name: "",
    location: point
  };
}

function getFeature(call, cb) {
  cb(null, checkFeature(call.request));
}

function listFeatures(call) {
  let lo = call.request.lo;
  let hi = call.request.hi;
  let left = _.min([lo.longitude, hi.longitude]);
  let right = _.max([lo.longitude, hi.longitude]);
  let top = _.max([lo.latitude, hi.latitude]);
  let bottom = _.min([lo.latitude, hi.latitude]);

  _.each(feature_list, function(feature) {
    if (feature.name === "") {
      return;
    }
    if (
      feature.location.longitude >= left &&
      feature.location.longitude <= right &&
      feature.location.latitude >= bottom &&
      feature.location.latitude <= top
    ) {
      call.write(feature);
    }
  });
  call.end();
}

function getDistance(start, end) {
  function toRadians(num) {
    return (num * Math.PI) / 180;
  }
  var R = 6371000; // earth radius in metres
  var lat1 = toRadians(start.latitude / COORD_FACTOR);
  var lat2 = toRadians(end.latitude / COORD_FACTOR);
  var lon1 = toRadians(start.longitude / COORD_FACTOR);
  var lon2 = toRadians(end.longitude / COORD_FACTOR);

  var deltalat = lat2 - lat1;
  var deltalon = lon2 - lon1;
  var a =
    Math.sin(deltalat / 2) * Math.sin(deltalat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltalon / 2) *
      Math.sin(deltalon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function recordRoute(call, cb) {
  let point_count = 0;
  let feature_count = 0;
  let distance = 0;
  let previous = null;
  // Start a timer
  let start_time = process.hrtime();
  call.on("data", point => console.log(point));
  call.on("end", () => {
    cb(null, {
      point_count: point_count,
      feature_count: feature_count,
      distance: distance | 0,
      elapsed_time: process.hrtime(start_time)[0]
    });
  });
}

function getServer() {
  const server = new grpc.Server();
  server.addService(routeguide.RouteGuide.service, {
    GetFeature: getFeature,
    ListFeatures: listFeatures,
    RecordRoute: recordRoute
  });
  return server;
}

if (require.main === module) {
  const routeServer = getServer();
  routeServer.bind("localhost:3333", grpc.ServerCredentials.createInsecure());
  const argv = parseArgs(process.argv, {
    string: "db_path"
  });
  fs.readFile(path.resolve(argv.db_path), (err, data) => {
    if (err) {
      throw err;
    }

    feature_list = JSON.parse(data);
    routeServer.start();
  });
}
