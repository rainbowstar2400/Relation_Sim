import { state } from './state.js';

export function addReportEvent(event) {
    const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
    if (!state.reports[dateKey]) {
        state.reports[dateKey] = { events: [], changes: [] };
    }
    state.reports[dateKey].events.push(event);
}

export function addReportChange(description) {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    if (!state.reports[dateKey]) {
        state.reports[dateKey] = { events: [], changes: [] };
    }
    state.reports[dateKey].changes.push({ time, description });
}
