import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithPopup,
  linkWithCredential,
  signInWithPopup,
  signInWithCredential,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../firebaseConfig.js'

export default function SettingsPage({ onSave, onLoad, onReset }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(auth.currentUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
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
      // 連携成功後に画面を更新
      window.location.reload()
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
      // 連携解除後に画面を更新
      window.location.reload()
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
      // 連携成功後に画面を更新
      window.location.reload()
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
      // 連携解除後に画面を更新
      window.location.reload()
    } catch (e) {
      console.error(e)
    }
  }

  const handleLoginGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    if (!auth.currentUser.isAnonymous) {
      navigate('/', { replace: true }) // ホームページに遷移
    }
    } catch (e) {
      alert('ログインに失敗しました')
      console.error(e)
    }
  }

  const handleLoginEmail = async () => {
    try {
      const cred = EmailAuthProvider.credential(loginEmail, loginPassword)
      await signInWithCredential(auth, cred)
    if (!auth.currentUser.isAnonymous) {
      navigate('/', { replace: true }) // ホームページに遷移
    }
    } catch (e) {
      alert('ログインに失敗しました')
      console.error(e)
    }
  }

  if (!user) return null

  const providerIds = user.providerData?.map(p => p.providerId) || []
  const linkedGoogle = providerIds.includes('google.com')
  const linkedEmail = providerIds.includes('password')
  const getShortName = info => {
    const name = info?.displayName || info?.email || ''
    return name.slice(0, 3)
  }
  const googleInfo = user.providerData.find(p => p.providerId === 'google.com')
  const emailInfo = user.providerData.find(p => p.providerId === 'password')
  const shortGoogle = getShortName(googleInfo)
  const shortEmail = getShortName(emailInfo)

  return (
    <section className="p-2">
      <h1 className="text-xl font-bold mb-4">設定</h1>
      {/* セーブデータ関連の見出しを軽く装飾 */}
      <h2 className="text-lg mb-2 font-semibold border-b border-gray-300 pb-1">
        セーブデータ管理
      </h2>
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

      {user.isAnonymous && (
        <>
          {/* ログインセクション */}
          <h2 className="text-lg mb-2 font-semibold border-b border-gray-300 pb-1">
            ログイン
          </h2>
          <p className="mb-2">既にアカウントをお持ちの方はこちらからログインしてください</p>
          <div className="flex flex-col gap-2 mb-4 w-fit">
            <button onClick={handleLoginGoogle}>Googleでログイン</button>
            <div className="flex flex-col gap-2 w-fit">
              <input
                type="email"
                className="text-black p-1 w-60"
                placeholder="メールアドレス"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
              <input
                type="password"
                className="text-black p-1 w-60"
                placeholder="パスワード"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
              <button onClick={handleLoginEmail}>メールアドレスでログイン</button>
            </div>
          </div>
        </>
      )}
      {/* アカウント連携の見出しを軽く装飾 */}
      <h2 className="text-lg mb-2 font-semibold border-b border-gray-300 pb-1">
        アカウント連携
      </h2>
      <div className="flex flex-col gap-2 w-fit">
        {user.isAnonymous && !linkedGoogle && (
          <button onClick={handleLinkGoogle}>Googleアカウントと連携する</button>
        )}
        {linkedGoogle && (
          <div className="flex flex-col gap-1">
            <p>
              Googleアカウント({shortGoogle}...)
              と連携済みです
            </p>
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
            <p>
              メールアドレス({shortEmail}...)
              と連携済みです
            </p>
            <button onClick={handleUnlinkEmail}>連携を解除する</button>
          </div>
        )}
      </div>
      <button className="mt-4" onClick={() => navigate(-1)}>戻る</button>
    </section>
  )
}
