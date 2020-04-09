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
    // console.log(result);

    response.send(result);
  });
});

const { WebhookClient, Payload } = require("dialogflow-fulfillment");
// const plans = require("./recommendation");
const fetch = require("node-fetch");

exports.dialogflowWebhook = functions.https.onRequest(
  async (request, response) => {
    const agent = new WebhookClient({ request, response });

    console.log(request.body);

    var session = request.body.session;
    var userID = session.substring(session.lastIndexOf("/") + 1);

    function welcome(agent) {
      agent.add("Welcome to my agent!");
    }

    function fallback(agent) {
      agent.add("Sorry, can you try again?");
    }

    const result = request.body.queryResult;

    // console.log(plans);

    function findNearbyRestaurantsHandler(agent) {
      // var payload;

      console.log("UserID: " + userID);

      const request = require("request-promise-native");

      const url =
        "https://exire-backend.herokuapp.com/plans/getRecommended/" + userID;

      return request.get(url).then((jsonBody) => {
        var body = JSON.parse(jsonBody);

        console.log(body);

        var venues = body;
        if (body.length > 4) {
          venues = body.splice(0, 3);
        }

        var venueIds = venues.map((item) => {
          return item.placeID;
        });

        console.log(venueIds);

        payload = {
          venues: venueIds,
          text: "Here are some restaurants!",
        };
        return agent.add(JSON.stringify(payload));

        // agent.add(JSON.stringify(payload));
        // return Promise.resolve(agent);
      });

      // await getRecommended(userID, (data) => {
      //   console.log(data);

      //   const payload = {
      //     venues: ["sushidamo", "hillcountrybbq", "bluesmoke"],
      //     text: "Here are some restaurants!",
      //   };

      //   agent.add(JSON.stringify(payload));
      // });

      // await getRecommended(userID, (data) => {
      //   var venues = data;
      //   if (data.length > 4) {
      //     venues = data.splice(0, 3);
      //   }

      //   var venueIds = venues.map((item) => {
      //     return item.placeID;
      //   });

      //   payload = {
      //     venues: venueIds,
      //     text: "Here are some restaurants!",
      //   };
      //   agent.add(JSON.stringify(payload));
      // });
    }

    async function userOnboardingHandler(agent) {
      // Do backend stuff here
      //   const db = admin.firestore();
      //   const profile = db.collection("users").doc("hayden");

      const { name, color } = result.parameters;

      //   await profile.set({ name, color });
      agent.add(`Welcome aboard my friend!`);
    }

    let intentMap = new Map();
    // intentMap.set("Default Welcome Intent", welcome);
    // intentMap.set("Default Fallback Intent", fallback);
    // intentMap.set("UserOnboarding", userOnboardingHandler);
    intentMap.set("FindRestaurants", findNearbyRestaurantsHandler);
    agent.handleRequest(intentMap);
  }
);

getRecommended = function (userID, callback) {
  fetch("https://exire-backend.herokuapp.com/plans/getRecommended/" + userID, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((responseJson) => {
      callback(responseJson);
      return true;
    })
    .catch((error) => {
      console.log(JSON.stringify(error));
      callback([]);
      return false;
    });
};
