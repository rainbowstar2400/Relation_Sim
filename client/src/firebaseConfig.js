import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// functions を利用するためにインポート
import { getFunctions } from "firebase/functions";

// 環境変数から取得
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// functions を初期化（リージョンはFunction側と合わせます）
const functions = getFunctions(app, "asia-northeast1");

signInAnonymously(auth)
  .then(() => console.log("匿名ログイン成功", auth.currentUser.uid))
  .catch((err) => console.error("匿名ログイン失敗", err));

// functions をエクスポートに追加
export { db, auth, functions };