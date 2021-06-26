var trkData = JSON.parse(localStorage.getItem("trkData"));
var idxToTrkIDArr = JSON.parse(localStorage.getItem("idxToTrkIDArr"));
const datasetIdx = localStorage.getItem("datasetIdx");
const numImg = localStorage.getItem("numImg");
var trkDataSortedByTrkID = [];
for (let i = 0; i < idxToTrkIDArr.length; i++) {
    trkDataSortedByTrkID[i] = trkData.filter(d => d.trkID === idxToTrkIDArr[i]);
}
const idxToTrkIDPredArr = [];
const trkIDToTrkIDPredMap = new Map();
const CORRECT_NUM_TRK_ID_PRED = 1;
trkDataSortedByTrkID
    .forEach(d => {
        let temp = d[0].trkIDPred;
        let tempMapVal = [temp];
        let tempArr = [];
        if (!idxToTrkIDPredArr.includes(temp)) tempArr.push(temp);
        d.forEach(d => {
            if (d.trkIDPred !== temp) {
                temp = d.trkIDPred;
                if (!idxToTrkIDPredArr.includes(temp)) tempArr.push(temp);
                tempMapVal.push(temp);
            }
        })
        if (tempMapVal.length > CORRECT_NUM_TRK_ID_PRED) {
            trkIDToTrkIDPredMap.set(d[0].trkID, tempMapVal);
            idxToTrkIDPredArr.push(...tempArr);
        }
    })
if (trkIDToTrkIDPredMap.size === 0) alert("Congratulation, this dataset has no error!")
trkData = trkData.filter(d => trkIDToTrkIDPredMap.has(d.trkID));
const trkDataSortedByTrkIDPred = [];
for (const id of idxToTrkIDPredArr) {
    trkDataSortedByTrkIDPred.push(trkData.filter(d => d.trkIDPred === id));
}
idxToTrkIDArr = idxToTrkIDArr.filter(d => trkIDToTrkIDPredMap.has(d));
trkDataSortedByTrkID = []
const trkIDToErrPathMap = new Map();
const trkIDToErrImgIdxMap = new Map();
for (const key of trkIDToTrkIDPredMap.keys()) {
    let tempTrk = trkData.filter(d => d.trkID === key);
    let tempIdx = tempTrk.findIndex(d => d.trkIDPred === trkIDToTrkIDPredMap.get(key)[1]) - 1;
    trkDataSortedByTrkID.push(tempTrk);
    tempTrk = trkDataSortedByTrkIDPred.filter(d => d[0].trkIDPred === trkIDToTrkIDPredMap.get(key)[0])[0];
    trkIDToErrPathMap.set(key, [[tempTrk[tempIdx].x, tempTrk[tempIdx].y], [tempTrk[tempIdx + 1].x, tempTrk[tempIdx + 1].y]]);
    trkIDToErrImgIdxMap.set(key, [tempTrk[tempIdx].imgIdx, tempTrk[tempIdx + 1].imgIdx]);
}
// transfer data
localStorage.clear();
localStorage.setItem("numImg", numImg);
localStorage.setItem("datasetIdx", datasetIdx);
localStorage.setItem("trkDataSortedByTrkID", JSON.stringify(trkDataSortedByTrkID));
localStorage.setItem("trkDataSortedByTrkIDPred", JSON.stringify(trkDataSortedByTrkIDPred));
localStorage.setItem("trkIDToTrkIDPredMap", JSON.stringify(Array.from(trkIDToTrkIDPredMap.entries())));
localStorage.setItem("numPageToAnalyse", 0);