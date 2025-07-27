const STORAGE_KEY = 'relation_sim_state';

export function saveState(state) {
    try {
        const data = {
            ...state,
            logs: state.logs,
            reports: state.reports,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('状態の保存に失敗しました', e);
    }
}

export function loadState() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
        const parsed = JSON.parse(data);
        parsed.logs = parsed.logs || {};
        parsed.reports = parsed.reports || {};
        return parsed;
    } catch (e) {
        console.error('保存データの読み込みに失敗しました', e);
        return null;
    }
}

export function exportState(state) {
    const data = {
        ...state,
        logs: state.logs,
        reports: state.reports,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    // ファイル名を「YYYY-M-D-HH:MM.json」の形式で生成
    const fileName =
        `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}:` +
        `${now.getMinutes().toString().padStart(2, '0')}.json`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function importStateFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                data.logs = data.logs || {};
                data.reports = data.reports || {};
                resolve(data);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}
