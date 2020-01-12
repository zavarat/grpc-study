"use strict";
const http = require("http");
http
  .createServer((req, res) => {
    req.setEncoding("utf8");
    req.on("data", chk => console.log(chk));
    res.end("server finished");
  })
  .listen(5555);
