// buttons
function changeDataset(idx) {
    // reinitialize global varibales
    trkData = [];
    newTreeH = 0;
    zmK = 1;
    treeGrpArr = [];
    treeWArr = [];
    treeData = [];
    roots = [];
    links = [];
    htmlArr = [];
    selHtmlArr = [];
    imgIdx = 0;
    IMG_SLD_EL.value = 0;
    // reload data
    loadData(idx);
    // remove existing paths and circles
    d3.selectAll("path").remove();
    d3.selectAll("circle").remove();
    // reset lineage image index indicator
    movelineageImgIdxInd()
    // reset zoom
    LINEAGE_SVG.call(LINEAGE_ZM.transform, d3.zoomIdentity);
    // update image
    updateImage(0);
    // change header
    DATASET_NAME_TEXT_EL.value = DATASET_TITLE_ARR[dataIdx - 1] ?
        DATASET_TITLE_ARR[dataIdx - 1]
        : `Dataset ${dataIdx}`;
    HEADER_1_EL.textContent = `Cell Tracking Visualization: ${DATASET_NAME_TEXT_EL.value}`;
}

function updateDatasetName() {
    DATASET_TITLE_ARR[dataIdx - 1] = DATASET_NAME_TEXT_EL.value;
    HEADER_1_EL.textContent = `Cell Tracking Visualization: ${DATASET_NAME_TEXT_EL.value}`;
}
const PREV_DATA_BTN = d3.select("#previousDatasetButton");
const NEXT_DATA_BTN = d3.select("#nextDatasetButton");
const HEADER_1_EL = document.getElementById("header1");
const DATASET_NAME_TEXT_EL = document.getElementById("datasetNameText");
const DATASET_TITLE_ARR = [];