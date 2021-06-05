const TRK_DATA = [];
var numImg;
d3.csv("/DataVis/src/a_01fld07_05-09-2021-12-48-25.csv").then(d => {
    let arrTrkID = [];
    let arrTreeID = [];
    let currTrkID = 0;
    let currTreeID = 0;
    let maxFrm = Math.max(...d.map(d => d.FRAME));
    let idxSecMaxFrm = d.findIndex(d => d.FRAME == maxFrm);
    function trkObject(i, d) {
        // image index
        this.imgIdx = +d.FRAME * 4 + i;
        // lineage ID
        if (arrTreeID[d.TRACK_ID] === undefined) arrTreeID[d.TRACK_ID] = currTreeID++;
        this.treeID = arrTreeID[d.TRACK_ID];
        // track ID
        if (arrTrkID[d.track_id_unique] === undefined) arrTrkID[d.track_id_unique] = currTrkID++;
        this.trkID = arrTrkID[d.track_id_unique]
        // parent track ID
        this.parentTrkID = d.track_id_parent == 0 ? -1 : arrTrkID[d.track_id_parent];
        // position
        if (i == 0) {
            this.x = +d.pos_x
            this.y = +d.pos_y;
        } else {
            if (i == 3) i = 2;
            this.x = +d.pos_x + +d[`dt${i}_n0_dx`]
            this.y = +d.pos_y + +d[`dt${i}_n0_dy`];
        }
    }
    let i = 0;
    for (; i < idxSecMaxFrm; i++) {
        TRK_DATA[i * 4] = new trkObject(0, d[i])
        TRK_DATA[i * 4 + 1] = new trkObject(1, d[i])
        TRK_DATA[i * 4 + 2] = new trkObject(2, d[i])
        TRK_DATA[i * 4 + 3] = new trkObject(3, d[i])
    }
    let tempIdx = idxSecMaxFrm * 3;
    for (; i < d.length; i++) {
        TRK_DATA[tempIdx + i] = new trkObject(0, d[i])
    }
    // variables to be set up using track data
    numImg = maxFrm * 4 + 1;
    numTrk = currTrkID;
    numTree = currTreeID;
    IMG_SLD_EL.max = numImg - 1;
    lineageImgIdxIndW = LINEAGE_W / numImg + 1;
    LINEAGE_IMG_IDX_IND
        .attr("width", lineageImgIdxIndW)
    SCL_IMG_IDX_TO_LINEAGE_W
        .domain([0, numImg - 1])
        .range([0, LINEAGE_W - lineageImgIdxIndW]);

    drawTree();
    drawTrack();
});