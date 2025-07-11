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