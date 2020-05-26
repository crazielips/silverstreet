var http = require('http'),
  fs = require('fs'),
  QUERYSTRING = require('querystring');
const CONFIG = require('dotenv');
const MESSAGING = require("./models/messaging")
CONFIG.config();


const PORT = process.env.PORT || 3000

//create a server object:
http.createServer(async (request, response) => {

  var response_format = {
    statusCode: 200,
    data: null
  }



  switch (request.url) {

    case '/messages':


      //Get next queued messages
      if ('GET' === request.method) {
        try {
          response_format.data = await MESSAGING.popMessage()
          await MESSAGING.deleteMessages(response_format.data)
          response_format.data = response_format.data.map(d => d.Body)
        } catch (error) {
          response_format.statusCode = 501;
          response_format.data = "Something is not right";
        }
        outputHelper(response, response_format)
        break
      }

      //Add to message queue
      if ('POST' === request.method) {
        try {
          let data = await extractPostData(request)
          if (!data.message) {
            throw "Message param is required"
          }
          response_format.data = await MESSAGING.pushMessage(data.message)
          outputHelper(response, response_format)
        } catch (error) {
          response_format.statusCode = 301;
          response_format.data = {
            error: error
          };
          outputHelper(response, response_format)
          return
        }
        break;
      }

      case '/messages/view':
        try {
          outputHelper(response, await readFile('./views/messages.html'), true)
        } catch (error) {
          response_format.statusCode = 404;
          response_format.data = [error];
          outputHelper(response, response_format)
        }
        break;

      case '/messages/documentation':
        try {
          outputHelper(response, await readFile('./views/documentation.html'), true)
        } catch (error) {
          response_format.statusCode = 404;
          response_format.data = [error];
          outputHelper(response, response_format)
        }
        break;

      case '/messages/list':
        // List all messages in queue
        if ('GET' === request.method) {
          response_format.data = await MESSAGING.getAllMessages()
          // response_format.data = response_format.data.map(d => d.Body)
          outputHelper(response, response_format)
          break
        }

        //No matching route found
        default:
          response_format.statusCode = 404;
          response_format.data = ["Requested endpoint not found!"];
          outputHelper(response, response_format)
          break;
  }

}).listen(PORT, function () {
  console.log("server start at port " + PORT);
});


function outputHelper(response, data, is_html) {
  is_html = is_html || false

  if (is_html) {
    response.writeHeader(200, {
      // "Content-Type": "text/html"
    });
    response.write(data);
    response.end();
    return
  }
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(data));
}

async function extractPostData(request) {
  return new Promise((yeap, nope) => {
    let valid_header_type = "application/x-www-form-urlencoded"
    if (valid_header_type != request.headers['content-type']) {
      nope(`Only ${valid_header_type} header type allowed`)
      return
    }
    var body = '';
    request.on('data', data => body += data);
    request.on('end', () => {
      yeap(QUERYSTRING.parse(body))
    });
  });
}

async function readFile(location) {
  return new Promise((yeap, nope) => {
    fs.readFile(location, function (err, html) {
      if (err) {
        nope(err)
        return
      }
      yeap(html)
    });
  })
}