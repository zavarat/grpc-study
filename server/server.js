"use strict";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const fs = require("fs");
const stream = require("stream");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const PROTO_PATH = path.join(__dirname, "..", "protos", "study.proto"); //    path.resolve("proto", "route.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const study = grpc.loadPackageDefinition(packageDefinition).study;

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

class MonitoringTransform extends stream.Transform {
  constructor(opt) {
    super(opt);
  }

  _transform(chk, enc, cb) {
    cb(null, chk.chk.toString());
  }
}

class LogTransform extends stream.Transform {
  constructor(opt) {
    super(opt);
  }

  _transform(chk, enc, cb) {
    cb(null, chk.f.chk.toString());
  }
}

class DownloadTransform extends stream.Transform {
  constructor(opt) {
    super(opt);
  }

  _transform(chk, enc, cb) {
    cb(null, {
      chk: chk
    });
  }
}

/**
 * 클라이언트가 보내는 정보는 call.request 객체에 담겨져 있습니다.
 * 클라이언트 id가 음수값이면 서버는 에러를 반환합니다.
 * 클아이언트 id가 0 이상인 경우에만 토큰을 반환합니다.
 */
function getToken(call, cb) {
  if (call.request.id < 0) {
    cb(new Error("client id must be more than equal to ZERO"));
  }

  require("crypto").randomBytes(10, function(err, buffer) {
    if (err) {
      cb(err);
    } else {
      cb(null, { tkn: buffer.toString("hex") });
    }
  });
}

//    서버가 받는 strm은 readable stream이다.
//    strm을 writable stream와 pipe로 연결해야한다.
//    writable stream은 duplex 스트림으로 구현하자.
function pipelineMonitoring(strm, cb) {
  stream.pipeline(
    strm,
    new MonitoringTransform({ objectMode: true }),
    fs.createWriteStream("output.txt"),
    err => {
      if (err) {
        console.log(`server side error : ${err}`);
        cb(err);
      } else {
        console.log("server side no error");
        cb(null, "server side finish");
      }
    }
  );
}

function logCllctr(strm, cb) {
  //const ww = fs.createWriteStream("output2.log");
  //strm.pipe(new LogTransform({ objectMode: true })).pipe(ww);
  // let ww = null;

  // function writeStreamData(rr, ww) {
  //   let chunk, ok;
  //   if ((chunk = rr.read()) !== null) {
  //     if (!ww) {
  //       ww = fs.createWriteStream(chunk.hostname + ".log", {
  //         flags: "a"
  //       });
  //     }
  //     ok = ww.write(chunk.f.chk.toString());
  //     if (!ok) {
  //       ww.removeAllListeners("drain");
  //       ww.once("drain", function() {
  //         writeStreamData(rr, ww);
  //       });
  //     } else {
  //       writeStreamData(rr, ww);
  //     }
  //   }
  // }

  // strm.on("readable", function() {
  //   console.log("in readable event");
  //   writeStreamData(strm, ww);
  // });
  let ww = null;
  strm.on("data", function handler(data) {
    if (!ww) {
      ww = fs.createWriteStream(data.hostname + ".log");
    }

    if (data && !ww.write(data.f.chk.toString())) {
      ww.removeAllListeners("drain");
      ww.once("drain", handler);
    }
  });

  strm.on("end", () => cb(null, { msg: "server log collector succeeded." }));
  strm.on("error", err => cb(err));
}

function fileDownload(strm) {
  const rr = fs.createReadStream(`${strm.request.name}`);
  const tt = new DownloadTransform({
    objectMode: true
  });

  stream.pipeline(rr, tt, strm, err => {
    if (err) {
      console.log(err.message);
    } else {
      console.log("서버 : 파일 전송 완료!, 파이프라인 성공.");
    }
  });
}

let username = null;
function chat(strm) {
  rl.on("line", data => {
    strm.write({
      who: username,
      msg: data
    });
  });

  strm.on("data", data => console.log(`${data.who} : ${data.msg}`));
}

function getServer() {
  const server = new grpc.Server();
  server.addService(study.MyService.service, {
    GetToken: getToken,
    LogCllctr: logCllctr,
    PipelineMonitoring: pipelineMonitoring,
    FileDownload: fileDownload,
    Chat: chat
  });
  return server;
}

if (require.main === module) {
  const server = getServer();
  rl.question("What is your name? ", answer => {
    username = answer;

    server.bind("localhost:3333", grpc.ServerCredentials.createInsecure());
    server.start();
  });
}
