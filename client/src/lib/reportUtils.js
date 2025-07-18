// reportUtils.js - 日報管理のユーティリティ
// state.reports を更新する純粋関数として実装します

/**
 * イベント発生を reports に記録します。
 * @param {Object} reports - 現在の reports オブジェクト
 * @param {Object} event - { timestamp, description } などの情報
 * @returns {Object} 更新後の reports
 */
export function addReportEvent(reports, event) {
  const dateKey = new Date(event.timestamp).toISOString().split('T')[0]
  const data = reports[dateKey] || { events: [], changes: [] }
  return {
    ...reports,
    [dateKey]: {
      events: [...data.events, event],
      changes: data.changes,
    },
  }
}

/**
 * 状態変化を reports に記録します。
 * @param {Object} reports - 現在の reports オブジェクト
 * @param {string} description - 変化内容の説明
 * @returns {Object} 更新後の reports
 */
export function addReportChange(reports, description, logId = null) {
  const now = new Date()
  const dateKey = now.toISOString().split('T')[0]
  const time = now.toTimeString().slice(0, 5)
  const data = reports[dateKey] || { events: [], changes: [] }
  return {
    ...reports,
    [dateKey]: {
      events: data.events,
      changes: [...data.changes, { time, description, logId }],
    },
  }
}
