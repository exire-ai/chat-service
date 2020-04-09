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
    console.log(result);

    response.send(result);
  });
});

const { WebhookClient, Payload } = require("dialogflow-fulfillment");

exports.dialogflowWebhook = functions.https.onRequest(
  async (request, response) => {
    const agent = new WebhookClient({ request, response });

    function welcome(agent) {
      agent.add("Welcome to my agent!");
    }

    function fallback(agent) {
      agent.add("Sorry, can you try again?");
    }

    const result = request.body.queryResult;

    function findNearbyRestaurantsHandler(agent) {
      const payload = {
        venues: ["nomwahnolita", "hillcountrybbq", "sushidamo"],
        text: "Here are some restaurants!",
      };

      agent.add(JSON.stringify(payload));

      const payload1 = new Payload("PLATFORM_UNSPECIFIED", payload, {
        rawPayload: true,
        sendAsMessage: true,
      });

      //   const payload2 = new Payload("PLATFORM_UNSPECIFIED", payload, {
      //     rawPayload: false,
      //     sendAsMessage: true,
      //   });

      //   console.log("Payload 1: " + JSON.stringify(payload1));
      //   console.log("Payload 2: " + JSON.stringify(payload2));
      //   console.log("Payload 3: " + JSON.stringify(payload3));

      //   agent.addPayloadResponse

      //   agent.add(
      //     new Payload("PLATFORM_UNSPECIFIED", payload, {
      //       rawPayload: true,
      //       sendAsMessage: true,
      //     })
      //   );
      //   agent.add("Here are some restaurants!");
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
