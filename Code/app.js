document.addEventListener('DOMContentLoaded', () => {

    // --- データ定義 ---
    let characters = [ // letに変更して、後から追加できるようにする
        { id: 'char_001', name: '碧', personality: { social: 4, kindness: 3, stubbornness: 2, activity: 5, expressiveness: 4 }, mbti: 'INFP', mbti_slider: [], talk_style: { preset: 'くだけた', first_person: '俺', suffix: '〜じゃん' }, activityPattern: '夜型', interests: ['読書', '散歩'] },
        { id: 'char_002', name: '彩花', personality: { social: 5, kindness: 4, stubbornness: 1, activity: 3, expressiveness: 5 }, mbti: 'ESFJ', mbti_slider: [], talk_style: { preset: '丁寧', first_person: '私', suffix: '〜です' }, activityPattern: '朝型', interests: ['お菓子作り', 'カフェ巡り'] },
        { id: 'char_003', name: '志音', personality: { social: 2, kindness: 5, stubbornness: 4, activity: 2, expressiveness: 2 }, mbti: 'ISFP', mbti_slider: [], talk_style: { preset: 'くだけた', first_person: 'ボク', suffix: '〜だよ' }, activityPattern: '通常', interests: ['音楽鑑賞'] },
    ];
    let currentlyEditingId = null;
    let relationships = []; // 関係ラベルを保存
    let nicknames = []; // 呼び方を保存
    const defaultAffections = {
        'なし': 0,
        '認知': 5,
        '友達': 20,
        '親友': 40,
        '恋人': 50,
        '家族': 50
    };
    let affections = []; // ▼▼▼ 好感度を保存する配列を追加
    let tempRelations = {}; // ▼▼▼ 追加: フォーム内で設定した関係を一時保存するオブジェクト
    const mbtiDescriptions = {
        INFP: "控えめだけど思慮深く、感受性豊かなタイプのようです。",
        INFJ: "物静かですが、強い信念を内に秘めている理想主義者です。",
        INTP: "知的な探求心が旺盛で、ユニークな視点を持つアイデアマンです。",
        INTJ: "戦略的な思考が得意で、計画を立てて物事を進める完璧主義者です。",
        ISFP: "柔軟な考え方を持ち、芸術的なセンスに優れた冒険家です。",
        ISFJ: "献身的で、大切な人を守ろうとする心温かい擁護者です。",
        ISTP: "大胆で実践的な思考を持ち、物事の仕組みを探求する職人です。",
        ISTJ: "実直で責任感が強く、伝統や秩序を重んじる管理者です。",
        ENFP: "情熱的で想像力豊か、常に新しい可能性を追い求める運動家です。",
        ENFJ: "カリスマ性と共感力を兼ね備え、人々を導く主人公タイプです。",
        ENTP: "頭の回転が速く、知的な挑戦を好む、鋭い論客です。",
        ENTJ: "リーダーシップに優れ、大胆な決断力で道を切り開く指揮官です。",
        ESFP: "陽気でエネルギッシュ、その場の注目を集めるエンターテイナーです。",
        ESFJ: "社交的で思いやりがあり、人々をサポートすることに喜びを感じる領事官です。",
        ESTP: "賢く、エネルギッシュで、リスクを恐れない起業家精神の持ち主です。",
        ESTJ: "優れた管理能力を持ち、物事を着実に実行していく、頼れる幹部タイプです。",
    };

    // --- DOM要素の取得 ---
    // HTMLの各要素をJavaScriptで操作するために、あらかじめ取得しておきます。
    // メイン画面の要素
    const mainViewSections = document.querySelectorAll('.character-observer, .consultation-area, .log-display');
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');
    const characterListElement = document.querySelector('.character-list');
    const mbtiInputs = {}; // ▼▼▼ MBTIスライダー用のオブジェクトを初期化
    for (let i = 1; i <= 16; i++) {
        mbtiInputs[`q${i}`] = document.getElementById(`mbti-q${i}`);
    }
    const mbtiManualSelect = document.getElementById('mbti-manual-select');

    // 管理室画面の要素
    const managementRoomView = document.getElementById('management-room');
    const backToMainButton = document.getElementById('back-to-main-button');
    const managementButton = document.querySelector('.top-menu button:first-child'); // 上部メニューの「管理室」ボタン

    const addCharacterForm = document.getElementById('add-character-form');
    const charNameInput = document.getElementById('char-name');
    const managementCharacterList = document.getElementById('character-list-in-mgmt');
    const formTitle = document.getElementById('form-title');
    const submitButton = document.querySelector('#add-character-form button[type="submit"]');

    // 追加フォームを表示するボタン
    const showAddFormButton = document.getElementById('show-add-form-button'); // ▼▼▼ 追加

    // 初期関係設定エリア
    const relationshipEditor = {
        targetSelect: document.getElementById('relationship-target-select'),
        typeSelect: document.getElementById('relationship-type-select'),
        // ▼▼▼ 以下を追加 ▼▼▼
        affectionToOtherSlider: document.getElementById('affection-to-other'),
        affectionToOtherValue: document.getElementById('affection-to-other-value'),
        affectionFromOtherSlider: document.getElementById('affection-from-other'),
        affectionFromOtherValue: document.getElementById('affection-from-other-value'),
        // ▲▲▲ ここまで追加 ▲▲▲
        nicknameToOtherInput: document.getElementById('nickname-to-other-input'),
        nicknameFromOtherInput: document.getElementById('nickname-from-other-input'),
        saveButton: document.getElementById('save-relationship-button'),
        displayList: document.getElementById('configured-relationships-list')
    };

    // 話し方の要素
    const talkStylePreset = document.querySelector('input[name="talk-preset"]:checked'); // この時点ではまだないため、後で取得
    const talkFirstPersonInput = document.getElementById('talk-first-person');
    const talkSuffixInput = document.getElementById('talk-suffix');

    // 興味関心ジャンルの要素
    const interestsInput = document.getElementById('interests'); // ▼▼▼ 追加

    // 活動パターンの要素
    const activityPattern = document.querySelector('input[name="activity-pattern"]:checked'); // この時点ではまだないため、後で取得

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
            resetFormState(); // 管理室表示時はまずフォームを隠す
        } else { // 'main' を表示する場合
            // 管理室を非表示に
            managementRoomView.style.display = 'none';
            // メイン画面のセクションをすべて表示
            mainViewSections.forEach(section => section.style.display = 'block');
            resetFormState(); // メイン画面に戻るときにフォームの状態をリセット
        }
    }

    /**
     * 初期関係設定フォームを描画する関数
     */
    function renderRelationshipEditor() {
        const targetSelect = relationshipEditor.targetSelect;
        targetSelect.innerHTML = '<option value="">--選択してください--</option>';

        // 自分以外のキャラクターを取得
        const otherCharacters = characters.filter(c => c.id !== currentlyEditingId);
        otherCharacters.forEach(char => {
            const option = document.createElement('option');
            option.value = char.id;
            option.textContent = char.name;
            targetSelect.appendChild(option);
        });

        updateConfiguredRelationshipsList();
        clearRelationshipInputs();
    }

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

        addCharacterForm.style.display = 'none'; // フォームを隠す
        showAddFormButton.style.display = 'block'; // 「＋」ボタンを表示

        tempRelations = {}; // ▼▼▼ 追加: 一時的な関係データもリセット
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

    function updateConfiguredRelationshipsList() {
        const displayList = relationshipEditor.displayList;
        displayList.innerHTML = '';
        // "自分"のID (追加モードなら新しいID、編集モードなら既存ID)
        const configuredIds = Object.keys(tempRelations);

        if (configuredIds.length === 0) {
            displayList.innerHTML = '<p>設定済みの関係はありません。</p>';
        } else {
            const ul = document.createElement('ul');
            configuredIds.forEach(id => {
                const otherChar = characters.find(c => c.id === id);
                const relData = tempRelations[id];
                if (otherChar) {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${otherChar.name}</strong>: ${relData.type}<br> (好感度: ${relData.affectionTo} / ${relData.affectionFrom} | 呼び方: ${relData.nicknameTo} / 呼ばれ方: ${relData.nicknameFrom})`;
                    ul.appendChild(li);
                }
            });
            displayList.appendChild(ul);
        }
    }

    function clearRelationshipInputs() {
        relationshipEditor.targetSelect.value = '';
        relationshipEditor.typeSelect.value = 'なし';
        relationshipEditor.nicknameToOtherInput.value = '';
        relationshipEditor.nicknameFromOtherInput.value = '';
    }

    // ▼▼▼ MBTI計算用の新しい関数 ▼▼▼
    /**
     * スライダーの値と性格特性からMBTIタイプを計算する
     * @param {number[]} sliderValues - 16個のスライダーの値(0-4)の配列
     * @param {object} personality - 性格パラメータオブジェクト
     * @returns {string} 4文字のMBTIタイプ (例: "INFP")
     */
    function calculateMbti(sliderValues, personality) {
        const scores = {
            ei: sliderValues[0] + sliderValues[4] + sliderValues[8] + sliderValues[12],  // Q1,5,9,13
            sn: sliderValues[1] + sliderValues[5] + sliderValues[9] + sliderValues[13],  // Q2,6,10,14
            tf: sliderValues[2] + sliderValues[6] + sliderValues[10] + sliderValues[14], // Q3,7,11,15
            jp: sliderValues[3] + sliderValues[7] + sliderValues[11] + sliderValues[15], // Q4,8,12,16
        };

        // 仕様書7.1.2のスコア判定ロジック
        let result = '';
        result += scores.ei <= 7 ? 'E' : scores.ei >= 9 ? 'I' : (personality.social >= 3 ? 'E' : 'I');
        result += scores.sn <= 7 ? 'S' : scores.sn >= 9 ? 'N' : (personality.expressiveness >= 3 ? 'N' : 'S');
        result += scores.tf <= 7 ? 'T' : scores.tf >= 9 ? 'F' : (personality.kindness >= 3 ? 'F' : 'T');
        result += scores.jp <= 7 ? 'J' : scores.jp >= 9 ? 'P' : (personality.activity >= 3 ? 'J' : 'P');

        return result;
    }

    // --- イベントリスナーの設定 ---
    managementButton.addEventListener('click', () => switchView('management'));
    backToMainButton.addEventListener('click', () => switchView('main'));

    // ▼▼▼ MBTIタブ切り替え用のイベントリスナーを追加 ▼▼▼
    const mbtiDiagModeBtn = document.getElementById('mbti-diag-mode-btn');
    const mbtiManualModeBtn = document.getElementById('mbti-manual-mode-btn');
    const mbtiDiagnosisView = document.getElementById('mbti-diagnosis-view');
    const mbtiManualView = document.getElementById('mbti-manual-view');

    // ▼▼▼ MBTI診断フロー用のイベントリスナーを追加 ▼▼▼
    const startDiagButton = document.getElementById('start-diag-button');
    const executeDiagButton = document.getElementById('execute-diag-button');
    const mbtiQuestionsArea = document.getElementById('mbti-questions-area');
    const mbtiResultArea = document.getElementById('mbti-result-area');
    const mbtiResultText = document.getElementById('mbti-result-text'); // 結果表示用のpタグも取得

    // 「診断スタート」ボタンの処理
    startDiagButton.addEventListener('click', () => {
        mbtiQuestionsArea.style.display = 'block'; // 質問エリアを表示
        startDiagButton.style.display = 'none';    // スタートボタン自体は隠す
        mbtiResultArea.style.display = 'none';   // もし結果が表示されていたら隠す

        // スライダーが正しく描画されるように、少し遅らせて再計算を実行
        setTimeout(alignAllSliderTicks, 0);
    });

    // 「診断する」ボタンの処理
    executeDiagButton.addEventListener('click', () => {
        // 16個のスライダーの値を取得
        const sliderValues = [];
        for (let i = 1; i <= 16; i++) {
            sliderValues.push(parseInt(mbtiInputs[`q${i}`].value));
        }

        // 性格パラメータの値も取得（タイブレーク用）
        const personality = {
            social: parseInt(personalityInputs.social.value),
            kindness: parseInt(personalityInputs.kindness.value),
            stubbornness: parseInt(personalityInputs.stubbornness.value),
            activity: parseInt(personalityInputs.activity.value),
            expressiveness: parseInt(personalityInputs.expressiveness.value),
        };

        // MBTIを計算
        const mbtiResult = calculateMbti(sliderValues, personality);

        // 説明文を取得（見つからない場合のデフォルト文も用意）
        const description = mbtiDescriptions[mbtiResult] || "説明文が見つかりませんでした。";

        // 結果を表示
        mbtiResultText.innerHTML = `この人の性格タイプは <strong>${mbtiResult}</strong> と診断されました。<br>${description}`;
        mbtiResultArea.style.display = 'block';
    });

    mbtiDiagModeBtn.addEventListener('click', () => {
        mbtiDiagnosisView.style.display = 'block';
        mbtiManualView.style.display = 'none';
        mbtiDiagModeBtn.classList.add('active');
        mbtiManualModeBtn.classList.remove('active');
    });

    mbtiManualModeBtn.addEventListener('click', () => {
        mbtiDiagnosisView.style.display = 'none';
        mbtiManualView.style.display = 'block';
        mbtiDiagModeBtn.classList.remove('active');
        mbtiManualModeBtn.classList.add('active');
    });

    // フォームが送信されたときの処理
    addCharacterForm.addEventListener('submit', (event) => {
        event.preventDefault(); // フォームのデフォルトの送信動作をキャンセル

        const personality = {
            social: parseInt(personalityInputs.social.value),
            kindness: parseInt(personalityInputs.kindness.value),
            stubbornness: parseInt(personalityInputs.stubbornness.value),
            activity: parseInt(personalityInputs.activity.value),
            expressiveness: parseInt(personalityInputs.expressiveness.value),
        };

        // MBTIの値を収集・計算
        let mbtiSliderValues = [];
        let mbtiResult;

        // 診断モードが選択されている場合
        if (mbtiDiagModeRadio.checked) {
            for (let i = 1; i <= 16; i++) {
                mbtiSliderValues.push(parseInt(mbtiInputs[`q${i}`].value));
            }
            mbtiResult = calculateMbti(mbtiSliderValues, personality);
        }
        // 手動モードが選択されている場合
        else {
            mbtiResult = mbtiManualSelect.value;
            // 手動設定の場合、スライダーの値は空にする
            mbtiSliderValues = [];
        }

        // ▼▼▼ 追加: 新しいフォームの値を取得 ▼▼▼
        const talkStyle = {
            preset: document.querySelector('input[name="talk-preset"]:checked').value,
            first_person: talkFirstPersonInput.value,
            suffix: talkSuffixInput.value,
        };
        const activityPatternValue = document.querySelector('input[name="activity-pattern"]:checked').value;
        const interestsValue = interestsInput.value.split(',').map(item => item.trim()).filter(item => item); // ▼▼▼ 追加

        let characterId;

        // 編集モードの場合の処理
        if (currentlyEditingId) {
            characterId = currentlyEditingId;

            // 更新対象のキャラクターを探す
            const charToUpdate = characters.find(char => char.id === characterId);
            if (charToUpdate) {
                // データを更新
                charToUpdate.name = charNameInput.value;
                charToUpdate.personality = personality;
                charToUpdate.mbti = mbtiResult;
                charToUpdate.mbti_slider = mbtiSliderValues;
                charToUpdate.talk_style = talkStyle;
                charToUpdate.activityPattern = activityPatternValue;
                charToUpdate.interests = interestsValue; // ▼▼▼ 追加
            }
            // ▼▼▼ 編集時は、古い関係データを一度すべて削除 ▼▼▼
            relationships = relationships.filter(r => !r.pair.includes(characterId));
            nicknames = nicknames.filter(n => n.from !== characterId && n.to !== characterId);
            affections = affections.filter(a => a.from !== characterId && a.to !== characterId);

            // 追加モードの場合の処理
        } else {
            characterId = 'char_' + Date.now();
            characters.push({
                id: characterId,
                name: charNameInput.value,
                personality,
                mbti: mbtiResult,
                mbti_slider: mbtiSliderValues,
                talk_style: talkStyle, // ▼▼▼ 追加
                activityPattern: activityPatternValue, // ▼▼▼ 追加
                interests: interestsValue, // ▼▼▼ 追加
            });
        }

        // ▼▼▼ 追加: 一時保存した関係を、正式なデータに登録 ▼▼▼
        Object.keys(tempRelations).forEach(targetId => {
            const relData = tempRelations[targetId];

            // 関係データを保存
            if (relData.type !== 'なし') {
                relationships.push({ pair: [characterId, targetId].sort(), label: relData.type });
            }
            // 呼び方データを保存
            if (relData.nicknameTo) {
                nicknames.push({ from: characterId, to: targetId, nickname: relData.nicknameTo });
            }
            // 呼ばれ方データを保存
            if (relData.nicknameFrom) {
                nicknames.push({ from: targetId, to: characterId, nickname: relData.nicknameFrom });
            }
            affections.push({ from: characterId, to: targetId, score: relData.affectionTo });
            affections.push({ from: targetId, to: characterId, score: relData.affectionFrom });
        });

        console.log("Characters:", characters);
        console.log("Relationships:", relationships);
        console.log("Nicknames:", nicknames);
        console.log("Affections:", affections);

        // 画面を再描画
        renderCharacters();
        renderManagementList();

        switchView('main'); // mainへの切り替えはresetFormStateの前に行う
    });

    // スライダーを動かしたときに値表示を更新する処理
    for (const key in personalityInputs) {
        personalityInputs[key].addEventListener('input', (event) => {
            personalityValues[key].textContent = event.target.value;
        });
    }

    // ▼▼▼ 「＋キャラクター追加」ボタンのイベントリスナーを追加 ▼▼▼
    showAddFormButton.addEventListener('click', () => {
        currentlyEditingId = null; // 必ず追加モードにする
        resetFormState(); // フォームの中身をリセット
        formTitle.textContent = 'キャラクター追加フォーム';
        submitButton.textContent = '追加する';
        addCharacterForm.style.display = 'block'; // フォームを表示
        showAddFormButton.style.display = 'none'; // 「＋」ボタンを隠す
        addCharacterForm.dataset.newId = 'char_' + Date.now(); // 追加モード用に仮IDを振る
        tempRelations = {}; // ▼▼▼ 追加: 追加モード開始時にリセット
        renderRelationshipEditor(); // 関係設定フォームを描画
    });

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

        // 編集ボタンがクリックされた場合
        else if (event.target.classList.contains('edit-button')) {
            const idToEdit = event.target.dataset.id;

            // 編集対象のキャラクターデータを取得
            const characterToEdit = characters.find(char => char.id === idToEdit);

            if (characterToEdit) {
                // フォームのタイトルを変更
                formTitle.textContent = 'キャラクター編集';

                submitButton.textContent = '更新する'; // ボタンのテキストを変更
                currentlyEditingId = idToEdit; // 編集モードに設定

                // フォームに既存のデータを入力
                charNameInput.value = characterToEdit.name;

                // スライダーにも既存のデータを反映
                for (const key in personalityInputs) {
                    personalityInputs[key].value = characterToEdit.personality[key];
                    personalityValues[key].textContent = characterToEdit.personality[key];
                }

                // MBTIスライダーにも値を反映
                if (characterToEdit.mbti_slider && characterToEdit.mbti_slider.length === 16) {
                    for (let i = 0; i < 16; i++) {
                        mbtiInputs[`q${i + 1}`].value = characterToEdit.mbti_slider[i];
                    }
                }

                // 手動選択プルダウンにも値を反映
                if (characterToEdit.mbti) {
                    mbtiManualSelect.value = characterToEdit.mbti;
                }

                // ▼▼▼ 追加: 新しいフォームに値を設定 ▼▼▼
                document.querySelector(`input[name="talk-preset"][value="${characterToEdit.talk_style.preset}"]`).checked = true;
                talkFirstPersonInput.value = characterToEdit.talk_style.first_person;
                talkSuffixInput.value = characterToEdit.talk_style.suffix;
                document.querySelector(`input[name="activity-pattern"][value="${characterToEdit.activityPattern}"]`).checked = true;

                currentlyEditingId = idToEdit; // 編集モードに設定
                addCharacterForm.style.display = 'block'; // フォームを表示
                showAddFormButton.style.display = 'none'; // 「＋」ボタンを隠す
                renderRelationshipForm(); // 関係設定フォームを描画

                interestsInput.value = characterToEdit.interests ? characterToEdit.interests.join(', ') : ''; // ▼▼▼ 追加

                // フォームが見えるようにスクロールする（UX向上のため）
                addCharacterForm.scrollIntoView({ behavior: 'smooth' });
            }

            tempRelations = {}; // ▼▼▼ 追加: 編集モード開始時にリセット

            // ▼▼▼ 既存の関係・呼び方・好感度を読み込んでtempRelationsを構築 ▼▼▼
            const existingRelations = relationships.filter(r => r.pair.includes(idToEdit));
            existingRelations.forEach(rel => {
                const targetId = rel.pair.find(id => id !== idToEdit);
                const affectionTo = affections.find(a => a.from === idToEdit && a.to === targetId)?.score || 0;
                const affectionFrom = affections.find(a => a.from === targetId && a.to === idToEdit)?.score || 0;
                const nicknameTo = nicknames.find(n => n.from === idToEdit && n.to === targetId)?.nickname || '';
                const nicknameFrom = nicknames.find(n => n.from === targetId && n.to === idToEdit)?.nickname || '';

                tempRelations[targetId] = {
                    type: rel.label,
                    nicknameTo: nicknameTo,
                    nicknameFrom: nicknameFrom,
                    affectionTo: affectionTo,
                    affectionFrom: affectionFrom,
                };
            });

            renderRelationshipEditor();
            addCharacterForm.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // ▼▼▼ 新しいイベントリスナーを追加 ▼▼▼
    relationshipEditor.typeSelect.addEventListener('change', (event) => {
        const selectedType = event.target.value;
        const defaultValue = defaultAffections[selectedType] || 0;

        // スライダーの値を更新
        relationshipEditor.affectionToOtherSlider.value = defaultValue;
        relationshipEditor.affectionFromOtherSlider.value = defaultValue;

        // スライダー横の数値表示も更新
        relationshipEditor.affectionToOtherValue.textContent = defaultValue;
        relationshipEditor.affectionFromOtherValue.textContent = defaultValue;
    });

    // スライダーを動かした時に横の数値を更新する処理も追加
    relationshipEditor.affectionToOtherSlider.addEventListener('input', (e) => {
        relationshipEditor.affectionToOtherValue.textContent = e.target.value;
    });
    relationshipEditor.affectionFromOtherSlider.addEventListener('input', (e) => {
        relationshipEditor.affectionFromOtherValue.textContent = e.target.value;
    });

    // ▼▼▼ `relationshipEditor.saveButton` のイベントリスナーを実装 ▼▼▼
    relationshipEditor.saveButton.addEventListener('click', () => {
        const targetId = relationshipEditor.targetSelect.value;
        if (!targetId) {
            alert('相手を選択してください。');
            return;
        }

        // フォームから値を取得
        tempRelations[targetId] = {
            type: relationshipEditor.typeSelect.value,
            nicknameTo: relationshipEditor.nicknameToOtherInput.value,
            nicknameFrom: relationshipEditor.nicknameFromOtherInput.value,
            affectionTo: parseInt(relationshipEditor.affectionToOtherSlider.value),
            affectionFrom: parseInt(relationshipEditor.affectionFromOtherSlider.value)
        };

        alert(`「${characters.find(c => c.id === targetId).name}」との関係を一時保存しました。`);

        // UIを更新して、設定済みの関係一覧に表示
        updateConfiguredRelationshipsList();
        // 入力欄をクリア
        clearRelationshipInputs();
    });

    relationshipEditor.saveButton.addEventListener('click', () => {
        const selfId = currentlyEditingId || `new_${addCharacterForm.dataset.newId}`;
        const targetId = relationshipEditor.targetSelect.value;
        const type = relationshipEditor.typeSelect.value;

        if (!targetId) {
            alert('相手を選択してください。');
            return;
        }

        // TODO: ここでrelationshipsとnicknames配列を更新する処理を追加
        alert(`「${selfId}」と「${targetId}」の関係を「${type}」に設定します。（保存処理は未実装）`);

        // UIを更新（仮）
        updateConfiguredRelationshipsList();
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

});