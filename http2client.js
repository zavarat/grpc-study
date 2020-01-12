"use strict";

const http2 = require("http2");
const { pipeline } = require("stream");
const { createReadStream, createWriteStream } = require("fs");
const { HTTP2_HEADER_PATH, HTTP2_HEADER_STATUS } = http2.constants;

const clientSession = http2.connect("http://localhost:4444");
clientSession.on("error", err => console.log(err));

const req = clientSession.request({
  [HTTP2_HEADER_PATH]: "/"
});

pipeline(req, createWriteStream("http2OUTPUT.txt"), err => {
  if (err) {
    console.log(`client failed : ${err}`);
  } else {
    console.log(`client success`);
  }
});
req.on("end", () => {
  console.log("ahf-----");
  clientSession.close();
});
