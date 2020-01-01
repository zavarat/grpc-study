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
const client = new routeguide.RouteGuide(
  "localhost:3333",
  grpc.credentials.createInsecure()
);
const COORD_FACTOR = 1e7;

function runGetFeature(cb) {
  console.log("inside rungetfeature function");
  let point1 = {
    latitude: 409146138,
    longitude: -746188906
  };

  function featureCB(err, feature) {
    if (err) {
      cb(err);
      return;
    }

    return feature;
  }
  let ret = client.getFeature(point1, featureCB);
  return new Promise(resolve => resolve(ret));
}

function runListFeatures() {
  let rectangle = {
    lo: {
      latitude: 400000000,
      longitude: -750000000
    },
    hi: {
      latitude: 420000000,
      longitude: -730000000
    }
  };

  console.log("Looking for features between 40, -75 and 42, -73");
  const call = client.listFeatures(rectangle);
  call.on("data", function(feature) {
    console.log(
      'Found feature called "' +
        feature.name +
        '" at ' +
        feature.location.latitude / COORD_FACTOR +
        ", " +
        feature.location.longitude / COORD_FACTOR
    );
  });
  call.on("end", () => console.log("list feature outer function succeeded."));
}

function runRecordRoute(cb) {
  const argv = parseArgs(process.argv, {
    string: "db_path"
  });

  fs.readFile(path.resolve(argv.db_path), (err, data) => {
    if (err) {
      cb(err);
      return;
    }
    let feature_list = JSON.parse(data);
    const call = client.recordRoute(function(error, stats) {
      if (error) {
        cb(error);
        return;
      }
      cb();
    });

    for (let i = 0; i < 2; ++i) {
      let rand_point = feature_list[_.random(0, feature_list.length - 1)];
      call.write({
        latitude: rand_point.location.latitude,
        longitude: rand_point.location.longitude
      });
    }

    call.end();
  });
}

async function main() {
  // runGetFeature(err => {
  //   if (err) {
  //     console.log("outer function has an error.");
  //   } else {
  //     console.log("outer function has succeeded.");
  //   }
  // });
  // runListFeatures();
  runRecordRoute(err => {
    if (err) {
      console.log("outer function has an error.");
    } else {
      console.log("outer function has succeeded.");
    }
  });
}

if (require.main === module) {
  main();
}
