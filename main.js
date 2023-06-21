const express = require('express');
const request = require('node-fetch');
const { Headers } = require("node-fetch");

/**
 * Rewrite the fetch function to add the headers you want to use
 * 
 * @param {string} url 
 * @returns {Promise<Response>} 
 */
async function fetch(url, headers){ 
  delete headers.host;
  delete headers.referer;

  let response = request(url, {
    headers: headers,
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

  const response = await fetch(oldUrl, req.headers)

  let headers = new Headers(response.headers); 
  // Remove the headers you don't want to use

  headers.delete("content-encoding");
  headers.delete("server");
  headers.delete("access-control-allow-origin");
  let responseToDisplay = "";

  // If the response is a m3u8 file, we need to rewrite the urls to use the proxy
  if (oldUrl.includes(".m3u8")) {
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
