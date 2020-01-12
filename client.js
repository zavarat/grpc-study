"use strict";

const parseArgs = require("minimist");
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const stream = require("stream");
const zlib = require("zlib");
const crypto = require("crypto");

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

const TS = new stream.Transform({
  objectMode: true,
  transform(data, enc, cb) {
    console.log(data.chk.toString());
    cb(null, data.chk.toString());
  }
});

const MyTransform = new stream.Transform({
  readableObjectMode: true,
  transform(chk, enc, cb) {
    console.log(chk.toString());
    cb(null, { chk: chk });
    // if (chk.toString().includes("ERROR")) {
    //   cb(new Error("민감정보 발견"));
    // } else {
    //   cb(null, { chk: chk });
    // }
  }
});

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

function runDataStreaming() {
  console.log("inside run-data-streaming()");
  //const rr = fs.createReadStream("test.txt");

  const strm = client.dataStreaming((err, ret) => {
    if (err) {
      console.log("client : file transfer failed.");
      console.log(err);
    } else {
      console.log("client : file transfer succeeded.");
    }
  });

  stream.pipeline(
    fs.createReadStream("test.txt", {
      encoding: "utf8"
    }),
    //zlib.createGzip(),
    MyTransform,
    strm,
    err => {
      if (err) {
        console.log(err.message);
      } else {
        console.log("pipeline succeeded");
      }
    }
  );
}

function runLogCllctr() {
  console.log("inside runlogcollector");
  const chokidar = require("chokidar");
  const watcher = chokidar.watch(path.join(__dirname, "test.txt"));
  watcher.on("change", path => {
    const rr = fs.createReadStream(path);
    const strm = client.logCllctr((err, res) => {
      if (err) {
        console.log("log collector failed.");
      } else {
        console.log("log collector succeeded.");
      }
    });

    rr.on("readable", () => {
      let chunk;
      while ((chunk = rr.read()) !== null) {
        strm.write({
          f: {
            chk: chunk
          },
          hostname: "jh-test"
        });
      }
    });

    rr.on("end", () => {
      strm.end({
        f: {
          chk: null
        },
        hostname: "jh-test"
      });
    });
  });
}

function runFileDownload() {
  const strm = client.fileDownload();
  stream.pipeline(strm, TS, fs.createWriteStream("duplexOUTPUT.txt"), err => {
    if (err) {
      console.log(err);
    } else {
      console.log("success");
    }
  });
  strm.on("end", () => {
    console.log("file download complete");
  });
}

function main() {
  //runDataStreaming();
  //runLogCllctr();
  runFileDownload();
}

if (require.main === module) {
  main();
}
