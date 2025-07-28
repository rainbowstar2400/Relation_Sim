import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
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
    const snap = await getDoc(ref)
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
