localStorage.clear();
const datasetArr = [];
var numDataset;
let doesTheDatasetExist = true;
function initializeData(numD) {
    numDataset = numD
    for (let i = 0; i < numDataset; i++) {
        d3.csv(`/DataVis/src/dataset_${i + 1}/track_data.csv`).then(rawData => {
            let tempNumImg = +rawData[rawData.length - 1].FRAME * 4 + 1;
            let tempTrkData = [];
            let tempTrkDataSortedByTrkID = [];
            let tempTrkDataSortedByTrkIDPred = [];
            let tempIdxToTrkIDArr = [];
            let tempIdxToTreeIDArr = [];
            let tempIdxToTrkIDPredArr = [];
            let tempTrkIDToErrTrkIDPredMap = new Map();
            let tempTrkIDToErrPathMap = new Map();
            let tempTrkIDToErrImgIdxMap = new Map();
            rawData
                .forEach(d => {
                    tempTrkData.push({
                        imgIdx: +d.FRAME * 4,
                        treeID: +d.TRACK_ID,
                        trkID: +d.track_id_unique,
                        trkIDPred: +d.track_id_unique_pred,
                        parentTrkID: +d.track_id_parent,
                        x: +d.pos_x,
                        y: +d.pos_y
                    }, {
                        imgIdx: +d.FRAME * 4 + 1,
                        treeID: +d.TRACK_ID,
                        trkID: +d.track_id_unique,
                        trkIDPred: +d.track_id_unique_pred,
                        parentTrkID: +d.track_id_parent,
                        x: +d.pos_x + +d.dt1_n0_dx,
                        y: +d.pos_y + +d.dt1_n0_dy
                    }, {
                        imgIdx: +d.FRAME * 4 + 2,
                        treeID: +d.TRACK_ID,
                        trkID: +d.track_id_unique,
                        trkIDPred: +d.track_id_unique_pred,
                        parentTrkID: +d.track_id_parent,
                        x: +d.pos_x + +d.dt2_n0_dx,
                        y: +d.pos_y + +d.dt2_n0_dy
                    }, {
                        imgIdx: +d.FRAME * 4 + 3,
                        treeID: +d.TRACK_ID,
                        trkID: +d.track_id_unique,
                        trkIDPred: +d.track_id_unique_pred,
                        parentTrkID: +d.track_id_parent,
                        x: +d.pos_x + +d.dt2_n0_dx,
                        y: +d.pos_y + +d.dt2_n0_dy
                    });
                    // tracks are sorted by appear frame
                    if (!tempIdxToTrkIDArr.includes(+d.track_id_unique)) {
                        tempIdxToTrkIDArr.push(+d.track_id_unique);
                    }
                    // trees are sorted by id
                    if (!tempIdxToTreeIDArr[+d.TRACK_ID]) {
                        tempIdxToTreeIDArr[+d.TRACK_ID] = +d.TRACK_ID;
                    }
                })
            tempTrkData = tempTrkData.filter(d => d.imgIdx < tempNumImg);
            tempIdxToTreeIDArr = tempIdxToTreeIDArr.filter(d => d !== undefined);
            for (let i = 0; i < tempIdxToTrkIDArr.length; i++) {
                tempTrkDataSortedByTrkID[i] = tempTrkData.filter(d => d.trkID === tempIdxToTrkIDArr[i]);
            }
            const CORRECT_NUM_TRK_ID_PRED = 1;
            tempTrkDataSortedByTrkID
                .forEach(d => {
                    let temp = d[0].trkIDPred;
                    let tempMapVal = [temp];
                    let tempArr = [];
                    if (!tempIdxToTrkIDPredArr.includes(temp)) tempArr.push(temp);
                    d.forEach(d => {
                        if (d.trkIDPred !== temp) {
                            temp = d.trkIDPred;
                            if (!tempIdxToTrkIDPredArr.includes(temp)) tempArr.push(temp);
                            tempMapVal.push(temp);
                        }
                    })
                    if (tempMapVal.length > CORRECT_NUM_TRK_ID_PRED) {
                        tempTrkIDToErrTrkIDPredMap.set(d[0].trkID, tempMapVal);
                        tempIdxToTrkIDPredArr.push(...tempArr);
                    }
                })

            for (const key of tempTrkIDToErrTrkIDPredMap.keys()) {
                const tempTrk = tempTrkData.filter(d => d.trkID === key);
                const tempTrkIDToErrImgIdxMapVal = [];
                const tempTrkIDToErrPathMapVal = [];
                let tempImgIdx = tempTrk[0].imgIdx;
                for (let i = 1; i < tempTrkIDToErrTrkIDPredMap.get(key).length; i++) {
                    let tempIdx = tempTrk.findIndex(d => d.trkIDPred === tempTrkIDToErrTrkIDPredMap.get(key)[i] && d.imgIdx > tempImgIdx) - 1;
                    let tempPt = tempTrk[tempIdx]
                    tempImgIdx = tempPt.imgIdx;
                    tempTrkIDToErrImgIdxMapVal[i - 1] = [tempPt.imgIdx];
                    tempTrkIDToErrPathMapVal[i - 1] = [[tempPt.x, tempPt.y]];
                    tempPt = tempTrkData.find(d => d.trkIDPred === tempPt.trkIDPred && d.imgIdx === tempPt.imgIdx + 1);
                    if (tempPt !== undefined) {
                        tempTrkIDToErrImgIdxMapVal[i - 1].push(tempPt.imgIdx)
                        tempTrkIDToErrPathMapVal[i - 1].push([tempPt.x, tempPt.y])
                    }
                    tempTrkIDToErrImgIdxMap.set(key, tempTrkIDToErrImgIdxMapVal);
                    tempTrkIDToErrPathMap.set(key, tempTrkIDToErrPathMapVal);
                }
            }
            datasetArr.push({
                datasetIdx: i + 1,
                numImg: tempNumImg,
                trkData: tempTrkData,
                idxToTrkIDArr: tempIdxToTrkIDArr,
                idxToTreeIDArr: tempIdxToTreeIDArr,
                trkDataSortedByTrkID: tempTrkDataSortedByTrkID,
                trkIDToErrTrkIDPredMap: tempTrkIDToErrTrkIDPredMap,
                trkIDToErrPathMap: tempTrkIDToErrPathMap,
                trkIDToErrImgIdxMap: tempTrkIDToErrImgIdxMap
            })

            if (datasetArr.length === numDataset) {
                datasetArr.sort((a, b) => b.trkIDToErrTrkIDPredMap.size - a.trkIDToErrTrkIDPredMap.size);
                createView1SVG();
                drawErrorTrack();
            }

        })
    }
}
