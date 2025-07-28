/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Cloud Scheduler から 15 分ごとに呼び出される予定の関数
exports.generateAutoEvents = onRequest(async (_req, res) => {
  try {
    const users = await db.collection("saves").get();
    const timestamp = Date.now();
    const results = [];

    for (const doc of users.docs) {
      const userId = doc.id;
      try {
        await db
          .collection("logs")
          .doc(userId)
          .collection("entries")
          .doc(String(timestamp))
          .set({
            timestamp,
            type: "AUTO",
            message: "自動イベントが発生しました",
          });
        results.push({ userId, status: "ok" });
      } catch (err) {
        logger.error(`ユーザー ${userId} の書き込みに失敗`, err);
        results.push({ userId, status: "error", error: err.message });
      }
    }

    res.status(200).json({ results });
  } catch (err) {
    logger.error("generateAutoEvents 全体でエラー発生", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
