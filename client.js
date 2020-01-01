"use strict";

const parseArgs = require("minimist");
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");

const { Writable } = require("stream");
const { StringDecoder } = require("string_decoder");

class StringWritable extends Writable {
  constructor(options) {
    super(options);
    this._decoder = new StringDecoder(options && options.defaultEncoding);
    this.data = "";
  }
  _write(chunk, encoding, callback) {
    if (encoding === "buffer") {
      chunk = this._decoder.write(chunk);
    }
    this.data += chunk;
  }
}

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
  const euro = [[0xe2, 0x82], [0xac]].map(Buffer.from);
  const w = new StringWritable({
    decodeStrings: false,
    defaultEncoding: "utf8"
  });

  client.recordRoute(w, (err, data) => {
    if (err) {
      cb(err);
      return;
    }

    console.log(data);
  });

  w.write("currency: ");
  w.write(euro[0]);
  w.end(euro[1]);
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
