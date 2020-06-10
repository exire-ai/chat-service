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
    var userID = request.body.userID;
    var users = request.body.users;

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

        payload = {
          venues: venueIds,
          text: "Here are some activites!",
        };
        return agent.add(JSON.stringify(payload));
      });
    }

    function groupRecommendations(agent) {
      const request = require("request-promise-native");

      const url =
        "https://exire-backend.herokuapp.com/plans/getRecommendedGroup"

      return request.post({url : url, body : {users: users}, headers : {'Content-type' : 'application/json'}}).then((jsonBody) => {
        var body = JSON.parse(jsonBody);

        var venueIds = body.recommended.map(item => item.placeID);

        payload = {
          venues: venueIds,
          text: "Here are some things you'll all like!",
        };
        return agent.add(JSON.stringify(payload));
      });
    }

    let intentMap = new Map();
    // intentMap.set("Default Welcome Intent", welcome);
    // intentMap.set("Default Fallback Intent", fallback);
    intentMap.set("GeneralRecommendations", generalRecommended);
    intentMap.set("FindRestaurants", findNearbyRestaurantsHandler);
    intentMap.set("ActivityRecommendations", activityRecommendations);
    intentMap.set("GroupRecommendations", groupRecommendations);
    agent.handleRequest(intentMap);
  }
);
