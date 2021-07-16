const datasetIdx = localStorage.getItem("datasetIdx");
const numImg = localStorage.getItem("numImg");
const trkIDToErrPathMap = new Map(JSON.parse(localStorage.getItem("trkIDToErrPathMap")));
const trkIDToErrImgIdxMap = new Map(JSON.parse(localStorage.getItem("trkIDToErrImgIdxMap")));
// includes error free track IDs because they share same treeID with error track
const idxToTrkIDArr = JSON.parse(localStorage.getItem("idxToTrkIDArr"));
// includes only error track IDs
const idxToErrTrkIDArr = JSON.parse(localStorage.getItem("idxToErrTrkIDArr"));
const idxToTreeIDArr = JSON.parse(localStorage.getItem("idxToTreeIDArr"));
const trkDataSortedByTrkID = JSON.parse(localStorage.getItem("trkDataSortedByTrkID"));
const trkData = trkDataSortedByTrkID.flat();
const numTrk = idxToTrkIDArr.length;
const numTree = idxToTreeIDArr.length;
