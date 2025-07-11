export function calculateMbti(sliderValues, personality) {
    const scores = {
        ei: sliderValues[0] + sliderValues[4] + sliderValues[8] + sliderValues[12],
        sn: sliderValues[1] + sliderValues[5] + sliderValues[9] + sliderValues[13],
        tf: sliderValues[2] + sliderValues[6] + sliderValues[10] + sliderValues[14],
        jp: sliderValues[3] + sliderValues[7] + sliderValues[11] + sliderValues[15],
    };
    let result = '';
    result += scores.ei <= 7 ? 'E' : scores.ei >= 9 ? 'I' : (personality.social >= 3 ? 'E' : 'I');
    result += scores.sn <= 7 ? 'S' : scores.sn >= 9 ? 'N' : (personality.expressiveness >= 3 ? 'N' : 'S');
    result += scores.tf <= 7 ? 'T' : scores.tf >= 9 ? 'F' : (personality.kindness >= 3 ? 'F' : 'T');
    result += scores.jp <= 7 ? 'J' : scores.jp >= 9 ? 'P' : (personality.activity >= 3 ? 'J' : 'P');
    return result;
}
