// --- データ定義 ---
let characters = [ // letに変更して、後から追加できるようにする
    { id: 'char_001', name: '碧', personality: { social: 4, kindness: 3, stubbornness: 2, activity: 5, expressiveness: 4 } },
    { id: 'char_002', name: '彩花', personality: { social: 5, kindness: 4, stubbornness: 1, activity: 3, expressiveness: 5 } },
    { id: 'char_003', name: '志音', personality: { social: 2, kindness: 5, stubbornness: 4, activity: 2, expressiveness: 2 } },
];
let currentlyEditingId = null;

// --- DOM要素の取得 ---
// HTMLの各要素をJavaScriptで操作するために、あらかじめ取得しておきます。
// メイン画面の要素
const mainViewSections = document.querySelectorAll('.character-observer, .consultation-area, .log-display');
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const characterListElement = document.querySelector('.character-list');

// 管理室画面の要素
const managementRoomView = document.getElementById('management-room');
const backToMainButton = document.getElementById('back-to-main-button');
const managementButton = document.querySelector('.top-menu button:first-child'); // 上部メニューの「管理室」ボタン


const addCharacterForm = document.getElementById('add-character-form');
const charNameInput = document.getElementById('char-name');
const managementCharacterList = document.getElementById('character-list-in-mgmt');
const formTitle = document.getElementById('form-title');
const submitButton = document.querySelector('#add-character-form button[type="submit"]');

// 性格スライダーの要素
const personalityInputs = {
    social: document.getElementById('social'),
    kindness: document.getElementById('kindness'),
    stubbornness: document.getElementById('stubbornness'),
    activity: document.getElementById('activity'),
    expressiveness: document.getElementById('expressiveness'),
};

// スライダーの値表示用span要素
const personalityValues = {
    social: document.getElementById('social-value'),
    kindness: document.getElementById('kindness-value'),
    stubbornness: document.getElementById('stubbornness-value'),
    activity: document.getElementById('activity-value'),
    expressiveness: document.getElementById('expressiveness-value'),
};

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

/**
 * 管理室の既存キャラクター一覧を描画する関数
 */
function renderManagementList() {
    // 一覧を空にする
    managementCharacterList.innerHTML = '';

    // キャラクターごとにリスト項目を作成
    characters.forEach(char => {
        const listItem = document.createElement('li');
        
        // キャラクター名を格納するspan
        const nameSpan = document.createElement('span');
        nameSpan.textContent = char.name;

        // ボタンを格納するdiv
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'character-actions';

        // [情報] [編集] [削除] ボタンを作成
        const infoButton = document.createElement('button');
        infoButton.textContent = '情報';
        infoButton.dataset.id = char.id; // どのキャラのボタンか分かるようにIDを設定

        const editButton = document.createElement('button');
        editButton.textContent = '編集';
        editButton.className = 'edit-button';
        editButton.dataset.id = char.id;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.className = 'delete-button'; // 削除ボタンだけ少しデザインを変えるため
        deleteButton.dataset.id = char.id;
        
        // divにボタンを追加
        actionsDiv.appendChild(infoButton);
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        
        // liに名前とボタンのdivを追加
        listItem.appendChild(nameSpan);
        listItem.appendChild(actionsDiv);
        
        // 全体をリストに追加
        managementCharacterList.appendChild(listItem);
    });
}

function switchView(viewToShow) {
    if (viewToShow === 'management') {
        // メイン画面のセクションをすべて非表示に
        mainViewSections.forEach(section => section.style.display = 'none');
        // 管理室だけを表示
        managementRoomView.style.display = 'block';
        alignAllSliderTicks(); // 管理室表示時に再計算
        renderManagementList(); // ▼▼▼ 追加 ▼▼▼ 管理室表示時に一覧を更新        
    } else { // 'main' を表示する場合
        // 管理室を非表示に
        managementRoomView.style.display = 'none';
        // メイン画面のセクションをすべて表示
        mainViewSections.forEach(section => section.style.display = 'block');
        resetFormState(); // メイン画面に戻るときにフォームの状態をリセット
    }
}

// ▼▼▼ 新しい関数 ▼▼▼
/**
 * フォームの状態を「追加モード」にリセットする関数
 */
function resetFormState() {
    formTitle.textContent = 'キャラクター追加フォーム';
    submitButton.textContent = '追加する';
    addCharacterForm.reset();
    for (const key in personalityValues) {
        personalityValues[key].textContent = '3';
    }
    currentlyEditingId = null; // 編集モードを解除
}

/**
 * 全てのスライダーの目盛りを正しい位置に配置する関数
 */
function alignAllSliderTicks() {
    // 全ての.slider-containerに対して処理を実行
    document.querySelectorAll('.slider-container').forEach(container => {
        const slider = container.querySelector('input[type="range"]');
        const ticksContainer = container.querySelector('.slider-ticks');
        if (!ticksContainer) return;
        const tickSpans = ticksContainer.querySelectorAll('span');
        
        // スライダーの実際の幅を取得
        const sliderWidth = slider.offsetWidth;
        const thumbWidth = 10; // ツマミの幅（CSSで指定したもの）
        
        // ツマミが移動できる実際の幅を計算
        const trackWidth = sliderWidth - thumbWidth;
        const numTicks = tickSpans.length;
        tickSpans.forEach((span, index) => {
            // 各目盛りの位置を計算
            // (ツマミの半分の幅) + (区間ごとの幅) * index
            const position = (thumbWidth / 2) + (trackWidth / (numTicks - 1)) * index;
            
            // 計算した位置をCSSのleftプロパティに設定
            span.style.left = `${position}px`;
        });
    });
}

// --- イベントリスナーの設定 ---
managementButton.addEventListener('click', () => switchView('management'));
backToMainButton.addEventListener('click', () => switchView('main'));

// フォームが送信されたときの処理
addCharacterForm.addEventListener('submit', (event) => {
    event.preventDefault(); // フォームのデフォルトの送信動作をキャンセル

    // 新しいキャラクターのIDを生成 (簡易的)
    const newId = 'char_' + Date.now();

    // 新しいキャラクターオブジェクトを作成
    const newCharacter = {
        id: newId,
        name: charNameInput.value,
        personality: {
            social: parseInt(personalityInputs.social.value),
            kindness: parseInt(personalityInputs.kindness.value),
            stubbornness: parseInt(personalityInputs.stubbornness.value),
            activity: parseInt(personalityInputs.activity.value),
            expressiveness: parseInt(personalityInputs.expressiveness.value),
        }
    };

    // characters配列に新しいキャラクターを追加
    characters.push(newCharacter);
    
    // メイン画面のキャラクター一覧を再描画
    renderCharacters();

    // フォームの内容をリセット
    addCharacterForm.reset();
    // スライダーの値表示もリセット
    for (const key in personalityValues) {
        personalityValues[key].textContent = '3';
    }

    // メイン画面に戻る
    switchView('main');

    // ログで確認
    console.log('新しいキャラクターが追加されました:', newCharacter);
    console.log('現在のキャラクターリスト:', characters);
});

// スライダーを動かしたときに値表示を更新する処理
for (const key in personalityInputs) {
    personalityInputs[key].addEventListener('input', (event) => {
        personalityValues[key].textContent = event.target.value;
    });
}

// ▼▼▼ 新しいイベントリスナー ▼▼▼
/**
 * 管理室のキャラクターリストがクリックされたときの処理
 * (イベント委任)
 */
managementCharacterList.addEventListener('click', (event) => {
    // クリックされたのが削除ボタンかどうかを判定
    if (event.target.classList.contains('delete-button')) {
        // どのキャラクターのボタンかIDを取得
        const idToDelete = event.target.dataset.id;
        
        // 仕様書(2.6.4)通り、確認ダイアログを表示
        if (confirm('本当にこのキャラクターを削除しますか？')) {
            // characters配列から、指定されたIDのキャラクターを除外した新しい配列を作成
            characters = characters.filter(char => char.id !== idToDelete);
            
            // 画面を再描画して、変更を反映
            renderManagementList(); // 管理室のリストを更新
            renderCharacters(); // メイン画面のカード一覧も更新
        }
    }
    // ▼▼▼ ここから追加 ▼▼▼
    // 編集ボタンがクリックされた場合
    else if (event.target.classList.contains('edit-button')) {
        const idToEdit = event.target.dataset.id;
        
        // 編集対象のキャラクターデータを取得
        const characterToEdit = characters.find(char => char.id === idToEdit);
        
        if (characterToEdit) {
            // フォームのタイトルを変更
            formTitle.textContent = 'キャラクター編集';

            // フォームに既存のデータを入力
            charNameInput.value = characterToEdit.name;
            
            // スライダーにも既存のデータを反映
            for (const key in personalityInputs) {
                personalityInputs[key].value = characterToEdit.personality[key];
                personalityValues[key].textContent = characterToEdit.personality[key];
            }
            
            // フォームが見えるようにスクロールする（UX向上のため）
            addCharacterForm.scrollIntoView({ behavior: 'smooth' });
        }
    }
    // ▲▲▲ ここまで追加 ▲▲▲
});

// 画面のリサイズ時にも再計算する
window.addEventListener('resize', alignAllSliderTicks);

// --- 初期化処理 ---

// 1秒ごと（1000ミリ秒）に updateDateTime 関数を呼び出し、時計を動かす
setInterval(updateDateTime, 1000);

// 最初に一度、関数を呼び出して画面に表示する
updateDateTime();
renderCharacters();
switchView('main');
alignAllSliderTicks(); // 初回読み込み時にも実行