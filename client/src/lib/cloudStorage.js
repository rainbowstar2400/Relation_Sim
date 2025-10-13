import { doc, setDoc, getDocFromServer, deleteDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig.js'

const COLLECTION = 'saves'

export async function saveGameData(userId, data) {
  if (!userId) return
  try {
    const ref = doc(db, COLLECTION, userId)
    await setDoc(ref, { ...data, updatedAt: Date.now() })
  } catch (e) {
    console.error('ゲームデータの保存に失敗しました', e)
  }
}

export async function loadGameData(userId) {
  if (!userId) return null
  try {
    const ref = doc(db, COLLECTION, userId)
    // getDoc では WebChannel を介したリアルタイム接続が張られ、
    // 環境によっては `Listen/channel` の 400 エラーがコンソールに表示される。
    // 一度きりの読み込みで十分なため REST ベースの getDocFromServer を利用し、
    // 不要なリッスン接続を避ける。
    const snap = await getDocFromServer(ref)
    return snap.exists() ? snap.data() : null
  } catch (e) {
    console.error('ゲームデータの読み込みに失敗しました', e)
    return null
  }
}

export async function deleteGameData(userId) {
  if (!userId) return
  try {
    await deleteDoc(doc(db, COLLECTION, userId))
  } catch (e) {
    console.error('ゲームデータの削除に失敗しました', e)
  }
}
