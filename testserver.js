"use strict";
const fs = require("fs");
const ww = fs.createWriteStream("output.txt");
require("http")
  .createServer((req, res) => {
    req.on("data", function handler(chk) {
      let ok = ww.write(chk.toString());
      if (!ok) {
        ww.once("drain", handler);
      }
    });

    req.on("end", () => {
      res.writeHead(200);
      res.end("file upload finished");
    });
  })
  .listen(4444, () => console.log("server is running on port num 4444"));
