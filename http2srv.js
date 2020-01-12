"use strict";

const http2 = require("http2");
const { createReadStream, createWriteStream } = require("fs");
const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE
} = http2.constants;
const { pipeline } = require("stream");

function streamHandler(stream, h, f) {
  console.log("streamHandler 함수 내부");

  pipeline(createReadStream("test.txt"), stream, err => {
    if (err) {
      console.log(`failed: ${err}`);
    } else {
      console.log("success!!");
    }
  });
}

const server = http2
  .createServer()
  .listen(4444, () => console.log("http2 server is running on 4444 port"));

//    새로운 http2stream 이 생성되면 아래의 이벤트가 호출된다.
server.on("stream", streamHandler);

//    세션 이벤트가 가장 먼저 호출된다.
server.on("session", () =>
  console.log("서버 : 세션이 성공적으로 맺어졌습니다.")
);
