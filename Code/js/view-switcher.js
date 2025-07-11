import { dom } from './dom-cache.js';
import { state } from './state.js';
import { renderManagementList } from './character-render.js';

export function switchView(viewToShow) {
    if (viewToShow === 'management') {
        dom.mainViewSections.forEach(section => section.style.display = 'none');
        dom.managementRoomView.style.display = 'block';
        requestAnimationFrame(alignAllSliderTicks);
        renderManagementList();
        resetFormState();
    } else {
        dom.managementRoomView.style.display = 'none';
        dom.mainViewSections.forEach(section => section.style.display = 'block');
        resetFormState();
    }
}

export function resetFormState() {
    dom.formTitle.textContent = 'キャラクター追加フォーム';
    dom.submitButton.textContent = '追加する';
    dom.addCharacterForm.reset();
    for (const key in dom.personalityValues) {
        dom.personalityValues[key].textContent = '3';
    }
    state.currentlyEditingId = null;

    dom.addCharacterForm.style.display = 'none';
    dom.showAddFormButton.style.display = 'block';

    state.tempRelations = {};
}

export function alignAllSliderTicks() {
    document.querySelectorAll('.slider-container').forEach(container => {
        const slider = container.querySelector('input[type="range"]');
        const ticksContainer = container.querySelector('.slider-ticks');
        if (!ticksContainer) return;
        const tickSpans = ticksContainer.querySelectorAll('span');

        const sliderWidth = slider.offsetWidth;
        const thumbWidth = 10;
        const trackWidth = sliderWidth - thumbWidth;
        const numTicks = tickSpans.length;
        tickSpans.forEach((span, index) => {
            const position = (thumbWidth / 2) + (trackWidth / (numTicks - 1)) * index;
            span.style.left = `${position}px`;
        });
    });
}
