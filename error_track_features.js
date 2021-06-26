var isNonselectedTrkHidden = false;
function isTrkSelected(trkID) {
    for (const collection of seletedHTMLCollectionArr) {
        for (const item of collection) {
            if (item.attributes.class.value === `Track ID: ${trkID}`) return true;
        }
    }
    return false;
}
const OFFSET_TIL_TRK_ID_BUTTON_CLASSNAME = 12;
const selectedTrackDisplayBox = d3.select("#selectedTrackDisplay")
    .text("Selcted Tracks")
selectedTrackDisplayBox.append("br");
function addToSelectedTrackDisplayBox(trkID) {
    let tempGroup = d3.select(`#selectedGroup${trkID}`);
    if (tempGroup.size() === 0) {
        tempGroup = selectedTrackDisplayBox.append("g").attr("id", `selectedGroup${trkID}`);
        const tempLabel = tempGroup.append("label")
            .attr("for", `#analyseTrack${trkID}`)
            .attr("id", `trackInfo${trkID}`)
        let tempText = `Original Track ID: ${trkID}\nPredicted Track ID: `;
        const trkIDPred = trkIDToTrkIDPredMap.get(trkID)
        for (let i = 0; i < trkIDPred.length - 1; i++) tempText += `${trkIDPred[i]}, `;
        tempText += `${trkIDPred[trkIDPred.length - 1]}`
        tempLabel.text(tempText);
        tempGroup.append("a")
            .attr("href", "error_track_analyzation.html")
            .attr("target", "_blank")
            .append("input")
            .attr("id", `analyseTrack${trkID}`)
            .attr("type", "button")
            .attr("value", "Analyse")
            .attr("onclick", 'setTrkToAnalyseArr(+this.getAttribute("id").slice(OFFSET_TIL_TRK_ID_BUTTON_CLASSNAME))')
        selectedTrackDisplayBox.append("br");

    }      
}
function removeFromSelectedTrackDisplayBox(trkID) {
    d3.select(`#selectedGroup${trkID}`).remove();
}
const trkToAnalyseArr = []
function setTrkToAnalyseArr(trkID) {
    trkToAnalyseArr.push(trkID)
    localStorage.setItem("setTrkToAnalyseArr", JSON.stringify(trkToAnalyseArr));
    localStorage.setItem("numPageToAnalyse", +localStorage.getItem("numPageToAnalyse") + 1);
}
