////////////////// image slider ////////////////////
// image slider
const IMG_SLD_EL = document.getElementById("imageSlider");
// slider label
const IMG_SLD_TXT = d3.select("#imageIndexLabel");
////////////////// change dataset ////////////////////
function changeDataset(idx) {
    initializeData(idx)
    // remove existing paths and circles
    d3.select("#treeGroup").selectAll("*").remove();
    d3.select("#trackGroup").selectAll("*").remove();
    // reset zoom
    LINEAGE_SVG.call(LINEAGE_ZM.transform, d3.zoomIdentity);
    // change header
    DATASET_NAME_TEXT_EL.value = DATASET_TITLE_ARR[idx - 1] ?
        DATASET_TITLE_ARR[idx - 1]
        : `Dataset ${idx}`;
    HEADER_1_EL.textContent = `Cell Tracking Visualization: ${DATASET_NAME_TEXT_EL.value}`;
}
function updateDatasetName() {
    DATASET_TITLE_ARR[datasetIdx - 1] = DATASET_NAME_TEXT_EL.value;
    HEADER_1_EL.textContent = `Cell Tracking Visualization: ${DATASET_NAME_TEXT_EL.value}`;
}
// buttons
const PREV_DATA_BTN = d3.select("#previousDatasetButton");
const NEXT_DATA_BTN = d3.select("#nextDatasetButton");
const HEADER_1_EL = document.getElementById("header1");
const DATASET_NAME_TEXT_EL = document.getElementById("datasetNameText");
const DATASET_TITLE_ARR = [];