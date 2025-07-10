// --- データ定義 ---
// 仕様書 6.2 を参考に、キャラクターの元になるデータを作成します。
// まずは名前だけを持つシンプルな形で定義します。
const characters = [
    { id: 'char_001', name: '碧' },
    { id: 'char_002', name: '彩花' },
    { id: 'char_003', name: '志音' },
    { id: 'char_004', name: '莉音' },
    { id: 'char_005', name: '咲' },
];

// --- DOM要素の取得 ---
// HTMLの各要素をJavaScriptで操作するために、あらかじめ取得しておきます。
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const characterListElement = document.querySelector('.character-list');

// --- 関数定義 ---

/**
 * 日時を更新する関数
 */
function updateDateTime() {
    const now = new Date();
    
    // 時刻を HH:mm:ss 形式にフォーマット
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}:${seconds}`;

    // 日付を YYYY/MM/DD 形式にフォーマット
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月は0から始まるため+1
    const day = String(now.getDate()).padStart(2, '0');
    dateElement.textContent = `${year}/${month}/${day}`;
}

/**
 * キャラクターリストを描画する関数
 */
function renderCharacters() {
    // 最初にリストの中を空にする（重複表示を防ぐため）
    characterListElement.innerHTML = '';

    // characters配列の各キャラクターデータに対して処理を行う
    characters.forEach(char => {
        // 新しいdiv要素（キャラクターカード）を作成
        const card = document.createElement('div');
        // CSSで定義した 'character-card' クラスを適用
        card.className = 'character-card';
        // カードにキャラクターの名前を表示
        card.textContent = char.name;
        // 作成したカードをHTMLのリストに追加
        characterListElement.appendChild(card);
    });
}

// --- 初期化処理 ---

// 1秒ごと（1000ミリ秒）に updateDateTime 関数を呼び出し、時計を動かす
setInterval(updateDateTime, 1000);

// 最初に一度、関数を呼び出して画面に表示する
updateDateTime();
renderCharacters();