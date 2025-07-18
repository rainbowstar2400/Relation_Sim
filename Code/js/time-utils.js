import { state } from './state.js';

let globalTimeModifiers = {};
let personalTimeModifiers = {};

export async function loadTimeModifiers() {
    const res = await fetch('./data/time_modifiers.json');
    const data = await res.json();
    globalTimeModifiers = data.globalTimeModifiers;
    personalTimeModifiers = data.personalTimeModifiers;
}

export function getTimeSlot(date = new Date()) {
    const h = date.getHours();
    if (h >= 5 && h <= 10) return 'morning';
    if (h >= 11 && h <= 15) return 'noon';
    if (h >= 16 && h <= 18) return 'evening';
    if (h >= 19 && h <= 23) return 'night';
    return 'midnight';
}

export function getTimeWeight(activityPattern) {
    const slot = getTimeSlot();
    const global = globalTimeModifiers[slot] || 1.0;
    const personal = (personalTimeModifiers[activityPattern] || personalTimeModifiers.normal || {})[slot] || 1.0;
    return global * personal;
}

function isSleeping(activityPattern, hour) {
    switch (activityPattern) {
        case 'morning':
            return hour >= 22 || hour < 5;
        case 'night':
            return hour >= 2 && hour < 8;
        default:
            return hour >= 0 && hour < 6;
    }
}

export function updateCharacterConditions() {
    const now = new Date();
    const hour = now.getHours();
    state.characters.forEach(c => {
        const asleep = isSleeping(c.activityPattern, hour);
        c.condition = asleep ? '就寝中' : '活動中';
    });
}
