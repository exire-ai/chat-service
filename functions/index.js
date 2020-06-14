const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://exiretest-kwrrpc.firebaseio.com/",
});

const { SessionsClient } = require("dialogflow");

exports.dialogflowGateway = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    const { queryInput, sessionId } = request.body;

    const sessionClient = new SessionsClient({ credentials: serviceAccount });
    const session = sessionClient.sessionPath("exiretest-kwrrpc", sessionId);
    const responses = await sessionClient.detectIntent({ session, queryInput });
    const result = responses[0].queryResult;

    response.send(result);
  });
});

const { WebhookClient, Payload } = require("dialogflow-fulfillment");
// const plans = require("./recommendation");
const fetch = require("node-fetch");

exports.dialogflowWebhook = functions.https.onRequest(
  async (request, response) => {
    const agent = new WebhookClient({ request, response });

    var session = request.body.session;
    var userID = "temp"
    if (session.includes('%')) {
      temp = session.split('%')
      if (temp.length === 2) {
        userID = temp[1]
      }
    }

    function welcome(agent) {
      agent.add("Welcome to my agent!");
    }

    function fallback(agent) {
      agent.add("Sorry, can you try again?");
    }

    const result = request.body.queryResult;

    //Find general recommondations
    function generalRecommended(agent) {
      const request = require("request-promise-native");

      const url =
        "https://exire-backend.herokuapp.com/plans/getRecommended/" + userID;

      return request.get(url).then((jsonBody) => {
        var body = JSON.parse(jsonBody);

        var venueIds = body.map((item) => {
          return item.placeID;
        });

        if (venueIds.length >= 6) {
          venueIds = venueIds.slice(0, 5)
        }

        payload = {
          venues: venueIds,
          text: "Here are some things I think you'd like!",
        };
        return agent.add(JSON.stringify(payload));
      });
    }

    //Find nearby restaurants
    function findNearbyRestaurantsHandler(agent) {
      const request = require("request-promise-native");

      const url =
        "https://exire-backend.herokuapp.com/plans/getFoodRecommended/" +
        userID;

      return request.get(url).then((jsonBody) => {
        var body = JSON.parse(jsonBody);

        var venueIds = body.map((item) => {
          return item.placeID;
        });

        if (venueIds.length >= 6) {
          venueIds = venueIds.slice(0, 5)
        }

        payload = {
          venues: venueIds,
          text: "Here are some restaurants!",
        };
        return agent.add(JSON.stringify(payload));
      });
    }

    //Find nearby activities
    function activityRecommendations(agent) {
      const request = require("request-promise-native");

      const url =
        "https://exire-backend.herokuapp.com/plans/getActivityRecommended/" +
        userID;

      return request.get(url).then((jsonBody) => {
        var body = JSON.parse(jsonBody);

        var venueIds = body.map((item) => {
          return item.placeID;
        });

        if (venueIds.length >= 6) {
          venueIds = venueIds.slice(0, 5)
        }

        payload = {
          venues: venueIds,
          text: "Here are some activites!",
        };
        return agent.add(JSON.stringify(payload));
      });
    }

    function specificRecommendations(agent) {
      // const request = require("request-promise");
      const request = require("request-promise-native");

      var url =
        "https://exire-backend.herokuapp.com/plans/getByCategoryList/"

      var categories = agent.parameters.categories.join(',')
      url = url.concat(categories);
      return request.get(url).then((jsonBody) => {
        var body = JSON.parse(jsonBody);

        var venueIds = body.map((item) => {
          return item.placeID;
        })

        if (venueIds.length >= 6) {
          venueIds = venueIds.slice(0, 5)
        }

        var text = ["Here are some places I love!", "Let me know if any of these interest you!", "Here are some places you might like!"]

        payload = {
          venues: venueIds,
          text:  text[Math.floor(Math.random() * text.length)]
        }
        return agent.add(JSON.stringify(payload))
      })
      // return request.post({url : url, body : {categories: categories}, headers : {'Content-type' : 'application/json'}}).then((jsonBody) => {
      //   var body = JSON.parse(jsonBody);
      //
      //   var venueIds = body.map(item => item.placeID);
      //
      //   payload = {
      //     venues: venueIds,
      //     text: agent.fulfillmentText,
      //   };
      //   return agent.add(JSON.stringify(payload));
      // });
      // return rp({
      //   method: 'POST',
      //   uri: 'https://exire-backend.herokuapp.com/plans/getByCategoryList',
      //   body: {
      //     categories: categories
      //   },
      //   json: true
      // }).then(function(parsedBody) {
      //
      // }).catch(function(err) {
      //
      // })
    }

    let intentMap = new Map();
    // intentMap.set("Default Welcome Intent", welcome);
    // intentMap.set("Default Fallback Intent", fallback);
    intentMap.set("GeneralRecommendations", generalRecommended);
    intentMap.set("FindRestaurants", findNearbyRestaurantsHandler);
    intentMap.set("ActivityRecommendations", activityRecommendations);
    intentMap.set("SpecificRecommendations", specificRecommendations);
    agent.handleRequest(intentMap);
  }
);
