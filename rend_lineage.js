/////////////// lineage tree zoom ////////////////
var newTreeH = 0;
var zmK = 1;
const TREE_GRP_ARR = [];
const TREE_W_ARR = [];
const SCL_ZM_LN_W = d3.scaleLinear();
function strechTrees(zm) {
    LINEAGE_GRP.attr("transform", `translate(0, ${zm.transform.y})`);
    if (zm.transform.k != zmK) {
        zmK = zm.transform.k;
        for (let i = 0; i < numTree; i++) {
            newTreeH = zm.transform.k * treeH;
            LINKS[i] = d3.tree().size([newTreeH, TREE_W_ARR[i]])(ROOTS[i]).links();
            TREE_GRP_ARR[i].attr("transform", `translate(0, ${i * newTreeH})`);
            TREE_GRP_ARR[i]
                .selectAll("path")
                .data(LINKS[i])
                .attr("d", LINK_HORIZ)
                .attr("stroke-width", SCL_ZM_LN_W(zm.transform.k));
        }
    }
}
const LINEAGE_ZM = d3.zoom()
    .on("zoom", d => strechTrees(d));

/////////////// lineage tree ////////////////
const LINEAGE_W = 700;
const LINEAGE_H = 700;
var treeH;
var numTree;
const LN_W = 3;
const SCL_IDX_TO_TREE_W = d3.scaleLinear()
    .range([0, LINEAGE_W]);
const LINEAGE_SVG = d3.select(".rend_lineage")
    .attr("width", LINEAGE_W)
    .attr("height", LINEAGE_H)
    .call(LINEAGE_ZM);
const LINEAGE_IMG_IDX_IND_GRP = LINEAGE_SVG.append("g")
    .attr("id", "lineageImageIndexIndicatorGroup");
const LINEAGE_GRP = LINEAGE_SVG.append("g")
    .attr("id", "lineageGroup")
    .attr("transform", `translate(0, 0)`);
const TREE_GRP = LINEAGE_GRP.append("g")
    .attr("id", "treeGroup");
// info about every track and its children
const TREE_DATA = [];
// tree info
const ROOTS = [];
// info used to build trees
const LINKS = [];
const LINK_HORIZ = d3.linkHorizontal().x(d => d.y).y(d => d.x);
// the function which return last appearing index of the tree
function getLastAppearIdx(root) {
    last = root.intvlOfExist[1];
    let temp = [];
    root.children[0].children
        .forEach(d => {
            temp.push(getLastAppearIdx(d));
        })
    last = Math.max(last, ...temp);
    return last;
}
// function that customize the tree by changing depth value
function setRootDepth(root) {
    root.depth = TREE_DATA.find(d => d.trkID == root.data.trkID).intvlOfExist[0];
    root.children[0].depth = TREE_DATA.find(d => d.trkID == root.data.trkID).intvlOfExist[1] + 1;
    root.children[0].children
        ?.forEach(d => {
            setRootDepth(d);
        })
}
// function that select lineage track and jump to start image index
function goStartIdxNHighlight() {
    const MOUSE_OVER_TRK_ID = this.getAttribute("class");
    if (MOUSE_OVER_TRK_ID.slice(7) != "undefined") {
        const startIdx = TREE_DATA.find(d => d.trkID == MOUSE_OVER_TRK_ID
            .replace(/\D/g, "")).intvlOfExist[0];
        if (imgIdx < startIdx) {
            IMG_SLD_EL.value = startIdx;
            updateImage(startIdx);
            movelineageImgIdxInd();
        }
        htmlArr = document.getElementsByClassName(MOUSE_OVER_TRK_ID);
        for (let item of htmlArr) {
            item.attributes.opacity.value = HT_TRK_DEF_OPACITY;
        }
        selectTrk();
    }
}
// the function that draw lineage tree
function drawTree() {
    SCL_IDX_TO_TREE_W
        .domain([0, numImg]);
    treeH = LINEAGE_H / numTree;
    LINEAGE_ZM
        .scaleExtent([1, LINEAGE_H / treeH / 2]);
    SCL_ZM_LN_W
        .domain(LINEAGE_ZM.scaleExtent())
        .range([LN_W, Math.log(SCL_ZM_LN_W.domain()[1] * LN_W)]);
    // build tree data
    for (i = 0; i < numTrk; i++) {
        let tempTrk = TRK_DATA.filter(d => d.trkID == i);
        TREE_DATA[i] = new Object();
        // ID
        TREE_DATA[i].treeID = tempTrk[0].treeID;
        TREE_DATA[i].trkID = i;
        TREE_DATA[i].parentTrkID = tempTrk[0].parentTrkID;
        // it is done to prevent the tree from branching at the very start
        TREE_DATA[i].children = [new Object()];
        TREE_DATA[i].children[0].children = [];
        // interval of existence
        TREE_DATA[i].intvlOfExist = [tempTrk[0].imgIdx, tempTrk[tempTrk.length - 1].imgIdx];
        // if tempTrk is a child of other trk, assign tempTrk as a child to its parent track
        if (tempTrk[0].parentTrkID != -1) {
            // check if tempTrk is already a child of its parent track
            if (!TREE_DATA[tempTrk[0].parentTrkID].children[0].children.includes(TREE_DATA[i])) {
                TREE_DATA[tempTrk[0].parentTrkID].children[0].children.push(TREE_DATA[i]);
            }
        }
    }
    // set up roots and links
    for (let i = 0; i < numTree; i++) {
        // get root track info
        let tempTrack = TREE_DATA.find(d => d.treeID == i && d.parentTrkID == -1);
        // set width of the tree to the lineage point of last appear frame
        TREE_W_ARR[i] = SCL_IDX_TO_TREE_W(getLastAppearIdx(tempTrack));
        let treeLayout = d3.tree().size([treeH, TREE_W_ARR[i]]);
        // set root
        ROOTS[i] = d3.hierarchy(tempTrack);
        // customize the tree
        setRootDepth(ROOTS[i]);
        // generate link
        LINKS[i] = treeLayout(ROOTS[i]).links();
    }
    // draw trees using information from links
    for (let i = 0; i < LINKS.length; i++) {
        TREE_GRP_ARR[i] = TREE_GRP.append("g")
            .attr("id", `treeID: ${LINKS[i][0].source.data.treeID}`)
            .attr("transform", `translate(0, ${i * treeH})`);
        TREE_GRP_ARR[i]
            .selectAll("path")
            .data(LINKS[i])
            .enter()
            .append("path")
            .attr("class", d => `trkID: ${d.source.data.trkID}`)
            .attr("d", LINK_HORIZ)
            .attr("opacity", NHT_TRK_DEF_OPACITY)
            .attr("fill", "none")
            .attr("stroke", TRK_FILL)
            .attr("stroke-width", LN_W)
            .on("mouseover", hightlightTrk)
            .on("mouseout", unhightlightTrk)
            .on("click", goStartIdxNHighlight);
    }
}
///////////////// lineage image index indicator ////////////////
const LINEAGE_IMG_IDX_IND_H = LINEAGE_H;
var lineageImgIdxIndW;
const LINEAGE_IMG_IDX_IND_OPACITY = 0.5;
const LINEAGE_IMG_IDX_IND_FILL = "black";
const LINEAGE_IMG_IDX_IND = LINEAGE_IMG_IDX_IND_GRP.append("rect")
    .attr("height", LINEAGE_IMG_IDX_IND_H)
    .attr('fill', LINEAGE_IMG_IDX_IND_FILL)
    .attr("opacity", LINEAGE_IMG_IDX_IND_OPACITY)
const SCL_IMG_IDX_TO_LINEAGE_W = d3.scaleLinear();
function movelineageImgIdxInd() {
    LINEAGE_IMG_IDX_IND
        .attr("transform", `translate(${SCL_IMG_IDX_TO_LINEAGE_W(imgIdx)}, 0)`);
}
