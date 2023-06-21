const express = require('express');
const request = require('node-fetch');
const { Headers } = require("node-fetch");
const https = require('https');

const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

/**
 * Rewrite the fetch function to add the headers you want to use
 * 
 * @param {string} url 
 * @returns {Promise<Response>} 
 */
async function fetch(url){ 
  let response = request(url, {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
        "sec-fetch-dest" : "iframe",
        "TE": "Trailers"
      },
    agent: httpsAgent
  });
  return response
}
/**
 * 
 * Default port for the server
 */
const port = 2545;
const app = express();
// Middleware to allow CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  });
  

app.get('/', async (req, res) => {
  // Get the URL from the query string
  const searchParams = new URLSearchParams(req.query);
  let oldUrl = decodeURIComponent(searchParams.get("url"));
  if(!oldUrl) return res.status(400).send("No URL provided");

  const response = await fetch(oldUrl);

  let headers = new Headers(response.headers); 
  // Remove the headers you don't want to use

  headers.delete("content-encoding");
  headers.delete("server");
  headers.delete("access-control-allow-origin");
  let responseToDisplay = "";

  // If the response is a m3u8 file, we need to rewrite the urls to use the proxy
  if (oldUrl.includes("m3u8")) {
    let m3u8ToUpdate = await response.text();
    responseToDisplay = m3u8ToUpdate.split("\n").map((url) => {
      if (url.startsWith("http")) {
        return "http://" + req.headers.host + "/?url=" + encodeURIComponent(url);
      } else {
        return url;
      }
    }).join("\n");
  } else {

  // If the response is not a m3u8 file, we need to convert the response to a buffer
  let blob = await response.blob();
  responseToDisplay = Buffer.from(await blob.arrayBuffer());
}

/**
 * 
 * Convert the headers to an object and send the response
 */

let headerObject = {};
headers.forEach((value, key) => {
  headerObject[key] = value;
});
  res.set(headerObject).status(response.status).send(responseToDisplay);
});

app.listen(port, () => {
  console.log(`Server started on port http://localhost:${port}`);
});
