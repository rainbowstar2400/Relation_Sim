/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");


admin.initializeApp();


// グローバルオプションでリージョンとmaxInstancesを設定
setGlobalOptions({ region: "asia-northeast1", maxInstances: 10 });


// Cloud Scheduler から 15 分ごとに自動実行される関数
exports.generateAutoEvents = onSchedule("every 15 minutes", async () => {
  const db = admin.firestore();

  try {
    const users = await db.collection("saves").get();
    const timestamp = Date.now();

    const promises = users.docs.map(async (doc) => {
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
      } catch (err) {
        logger.error(`ユーザー ${userId} の書き込みに失敗`, err);
        throw err;
      }
    });

    await Promise.all(promises);
    logger.log(`自動イベントを ${users.size} 件作成しました。`);
  } catch (err) {
    logger.error("generateAutoEvents 実行中にエラーが発生しました", err);
    throw err;
  }
});

// クライアントから呼び出され、指定されたUIDの匿名ユーザーを削除する関数
exports.deleteAnonymousUser = onCall({ region: "asia-northeast1" }, async (request) => {
  // 1. リクエスト元のユーザーが認証済みかチェック
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "この機能の利用には認証が必要です。"
    );
  }

  // 2. クライアントから渡された匿名ユーザーのUIDを取得
  const anonymousUid = request.data.uid;
  if (!anonymousUid || typeof anonymousUid !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "削除対象の匿名ユーザーのUIDが不正です。"
    );
  }

  try {
    // 3. Admin SDKを使ってUIDでユーザーを削除
    await admin.auth().deleteUser(anonymousUid);
    const message = `Success: 匿名ユーザー (UID: ${anonymousUid}) を削除しました。`;
    logger.log(message);
    return { success: true, message: message };
  } catch (error) {
    logger.error(`ユーザー(UID: ${anonymousUid})の削除に失敗しました。`, error);
    // 削除に失敗した場合はクライアントにエラーを返す
    throw new functions.https.HttpsError(
      "internal",
      "ユーザーの削除中にサーバーエラーが発生しました。",
      error
    );
  }
});