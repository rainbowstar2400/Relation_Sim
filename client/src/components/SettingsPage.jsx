import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithPopup,
  linkWithCredential,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../firebaseConfig.js'

export default function SettingsPage({ onSave, onLoad, onReset }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(auth.currentUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return unsub
  }, [])

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return
    try {
      await linkWithPopup(auth.currentUser, new GoogleAuthProvider())
      setUser(auth.currentUser)
    } catch (e) {
      if (e.code === 'auth/email-already-in-use' || e.code === 'auth/credential-already-in-use') {
        alert('すでに使用されている認証情報です')
      } else {
        console.error(e)
      }
    }
  }

  const handleUnlinkGoogle = async () => {
    if (!auth.currentUser) return
    try {
      await auth.currentUser.unlink('google.com')
      setUser(auth.currentUser)
    } catch (e) {
      console.error(e)
    }
  }

  const handleLinkEmail = async () => {
    if (!auth.currentUser) return
    try {
      const cred = EmailAuthProvider.credential(email, password)
      await linkWithCredential(auth.currentUser, cred)
      setUser(auth.currentUser)
      setEmail('')
      setPassword('')
    } catch (e) {
      if (e.code === 'auth/email-already-in-use' || e.code === 'auth/credential-already-in-use') {
        alert('このメールアドレスは既に使用されています')
      } else {
        console.error(e)
      }
    }
  }

  const handleUnlinkEmail = async () => {
    if (!auth.currentUser) return
    try {
      await auth.currentUser.unlink('password')
      setUser(auth.currentUser)
    } catch (e) {
      console.error(e)
    }
  }

  if (!user) return null

  const providerIds = user.providerData?.map(p => p.providerId) || []
  const linkedGoogle = providerIds.includes('google.com')
  const linkedEmail = providerIds.includes('password')

  return (
    <section className="p-2">
      <h1 className="text-xl font-bold mb-4">設定</h1>
      <h2 className="text-lg mb-2">セーブデータ</h2>
      <div className="flex flex-col gap-2 mb-4 w-fit">
        <button onClick={onSave}>セーブ</button>
        <button onClick={() => fileInputRef.current?.click()}>ロード</button>
        <button onClick={onReset}>リセット</button>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) onLoad(file)
            e.target.value = ''
          }}
        />
      </div>
      <h2 className="text-lg mb-2">アカウント連携</h2>
      <div className="flex flex-col gap-2 w-fit">
        {user.isAnonymous && !linkedGoogle && (
          <button onClick={handleLinkGoogle}>Googleアカウントと連携する</button>
        )}
        {linkedGoogle && (
          <div className="flex flex-col gap-1">
            <p>Googleアカウントと連携済みです</p>
            <button onClick={handleUnlinkGoogle}>連携を解除する</button>
          </div>
        )}
        {user.isAnonymous && !linkedEmail && (
          <div className="flex flex-col gap-2 w-fit">
            <input
              type="email"
              className="text-black p-1 w-60"
              placeholder="メールアドレス"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="text-black p-1 w-60"
              placeholder="パスワード"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button onClick={handleLinkEmail}>メールアドレスと連携する</button>
          </div>
        )}
        {linkedEmail && (
          <div className="flex flex-col gap-1">
            <p>メールアドレスと連携済みです</p>
            <button onClick={handleUnlinkEmail}>連携を解除する</button>
          </div>
        )}
      </div>
      <button className="mt-4" onClick={() => navigate(-1)}>戻る</button>
    </section>
  )
}
