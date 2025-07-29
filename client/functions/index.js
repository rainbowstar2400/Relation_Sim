/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions/v2");
// 変更点: v2のonRequestをインポート
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();


// グローバルオプションでmaxInstancesを設定
setGlobalOptions({ maxInstances: 10 });


// Cloud Scheduler から 15 分ごとに呼び出される予定の関数
// 変更点: onRequestの第一引数にリージョンを指定
exports.generateAutoEvents = onRequest({ region: "asia-northeast1" }, async (_req, res) => {
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