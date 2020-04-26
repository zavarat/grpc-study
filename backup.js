"use strict";

const parseArgs = require("minimist");
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const fs = require("fs");
const stream = require("stream");
const zlib = require("zlib");
const crypto = require("crypto");

const PROTO_PATH = path.join(__dirname, "..", "protos", "study.proto"); //    path.resolve("proto", "route.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const study = grpc.loadPackageDefinition(packageDefinition).study;
const client = new study.MyService(
  "localhost:3333",
  grpc.credentials.createInsecure()
);

const TS = new stream.Transform({
  objectMode: true,
  transform(data, enc, cb) {
    console.log(data.chk.toString());
    cb(null, data.chk.toString());
  }
});

const MyTransform = new stream.Transform({
  objectMode: true,
  transform(chk, enc, cb) {
    cb(null, { chk: chk });
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

async function runGetTkn() {
  //    클라이언트의 요청을 아래와 같이 정의합니다.
  let user = {
    id: 100
  };

  let promisified = function(req) {
    return new Promise((resolve, reject) => {
      client.getToken(req, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  };

  try {
    const ret = await promisified(user);
    console.log(`client has gotten a new token : ${ret.tkn}`);
  } catch (err) {
    console.log(err.message);
  }
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
    fs.createReadStream("test.txt"),
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

    // rr.on("readable", () => {
    //   let chunk;
    //   while ((chunk = rr.read()) !== null) {
    //     strm.write({
    //       f: {
    //         chk: chunk
    //       },
    //       hostname: "jh-test"
    //     });
    //   }
    // });

    rr.on("readable", function send() {
      let chunk;
      while ((chunk = rr.read()) !== null) {
        let flag = strm.write({
          f: {
            chk: chunk
          },
          hostname: "jh-test"
        });

        //    back-pressure 발생을 감지한다.
        if (!flag) {
          return strm.on("drain", send);
        }
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
  //runFileDownload();
}

if (require.main === module) {
  runGetTkn();
}
