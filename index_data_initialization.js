var trkData;
var numImg;
var datasetIdx;
var idxToTrkIDArr;
var idxToTreeIDArr;
function initializeData(datasetIdx) {
    this.datasetIdx = datasetIdx;
    d3.csv(`/src/dataset_${this.datasetIdx}/track_data.csv`).then(rawData => {
        newTreeH = 0;
        zmK = 1;
        treeGrpArr = [];
        treeWArr = [];
        htmlArr = [];
        selHtmlArr = [];
        IMG_SLD_EL.value = 0;
        treeData = [];
        roots = [];
        links = [];
        numImg = +rawData[rawData.length - 1].FRAME * 4 + 1;
        idxToTrkIDArr = [];
        idxToTreeIDArr = [];
        trkData = [];
        rawData
            .forEach(d => {
                trkData.push({
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
                if (!idxToTrkIDArr.includes(+d.track_id_unique)) {
                    idxToTrkIDArr.push(+d.track_id_unique);
                }
                if (!idxToTreeIDArr[+d.TRACK_ID]) {
                    idxToTreeIDArr[+d.TRACK_ID] = +d.TRACK_ID;
                }
            })
        trkData = trkData.filter(d => d.imgIdx < numImg);
        idxToTreeIDArr = idxToTreeIDArr.filter(d => d !== undefined);
        numTrk = idxToTrkIDArr.length;
        numTree = idxToTreeIDArr.length;
        IMG_SLD_EL.max = numImg - 1;
        lineageImgIdxIndW = LINEAGE_W / numImg + 1;
        LINEAGE_IMG_IDX_IND
            .attr("width", lineageImgIdxIndW)
        SCL_IMG_IDX_TO_LINEAGE_W
            .domain([0, numImg - 1])
            .range([0, LINEAGE_W - lineageImgIdxIndW]);

        updateImage(0);
        drawTree();
        drawTrack();
        movelineageImgIdxInd();
        ////////////////// transfer data ////////////////////
        localStorage.setItem("trkData", JSON.stringify(trkData));
        localStorage.setItem("numImg", numImg);
        localStorage.setItem("datasetIdx", datasetIdx);
        localStorage.setItem("idxToTrkIDArr", JSON.stringify(idxToTrkIDArr));
    });
}
initializeData(1);
window.onunload = () => {
    localStorage.clear()
}