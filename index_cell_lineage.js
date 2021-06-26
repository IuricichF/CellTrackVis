/////////////// lineage tree zoom ////////////////
var newTreeH;
var zmK;
var treeGrpArr;
var treeWArr;
const SCL_ZM_LN_W = d3.scaleLinear();
function strechTrees(zm) {
    LINEAGE_GRP.attr("transform", `translate(0, ${zm.transform.y})`);
    if (zm.transform.k != zmK) {
        zmK = zm.transform.k;
        for (let i = 0; i < numTree; i++) {
            newTreeH = zm.transform.k * treeH;
            links[i] = d3.tree().size([newTreeH, treeWArr[i]])(roots[i]).links();
            treeGrpArr[i].attr("transform", `translate(0, ${i * newTreeH})`);
            treeGrpArr[i]
                .selectAll("path")
                .data(links[i])
                .attr("d", LINK_HORIZ)
                .attr("stroke-width", SCL_ZM_LN_W(zm.transform.k));
        }
    }
}
var LINEAGE_ZM = d3.zoom()
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
var treeData;
// tree info
var roots;
// info used to build trees
var links;
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
    root.depth = treeData.find(d => d.trkID == root.data.trkID).intvlOfExist[0];
    root.children[0].depth = treeData.find(d => d.trkID == root.data.trkID).intvlOfExist[1] + 1;
    root.children[0].children
        ?.forEach(d => {
            setRootDepth(d);
        })
}
// function that select lineage track and jump to start image index
function goStartIdxNHighlight() {
    const MOUSE_OVER_TRK_ID = this.getAttribute("class");
    if (MOUSE_OVER_TRK_ID.slice(7) != "undefined") {
        const startIdx = treeData.find(d => d.trkID == MOUSE_OVER_TRK_ID
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
        let tempTrk = trkData.filter(d => d.trkID == idxToTrkIDArr[i]);
        treeData[i] = new Object();
        // ID
        treeData[i].treeID = tempTrk[0].treeID;
        treeData[i].trkID = tempTrk[0].trkID;
        treeData[i].parentTrkID = tempTrk[0].parentTrkID;
        // it is done to prevent the tree from branching at the very start
        treeData[i].children = [new Object()];
        treeData[i].children[0].children = [];
        // interval of existence
        treeData[i].intvlOfExist = [tempTrk[0].imgIdx, tempTrk[tempTrk.length - 1].imgIdx];
        // if tempTrk is a child of other trk, assign tempTrk as a child to its parent track
        if (tempTrk[0].parentTrkID > 0) {
            let temp = idxToTrkIDArr.indexOf(tempTrk[0].parentTrkID);
            // check if tempTrk is already a child of its parent track
            if (!treeData[temp].children[0].children.includes(treeData[i])) {
                treeData[temp].children[0].children.push(treeData[i]);
            }
        }
    }
    // set up roots and links
    for (let i = 0; i < numTree; i++) {
        // get root track info
        let tempTrack = treeData.find(d => d.treeID == idxToTreeIDArr[i] && d.parentTrkID == 0);
        // set width of the tree to the lineage point of last appear frame
        treeWArr[i] = SCL_IDX_TO_TREE_W(getLastAppearIdx(tempTrack));
        let treeLayout = d3.tree().size([treeH, treeWArr[i]]);
        // set root
        roots[i] = d3.hierarchy(tempTrack);
        // customize the tree
        setRootDepth(roots[i]);
        // generate link
        links[i] = treeLayout(roots[i]).links();
    }
    // draw trees using information from links
    for (let i = 0; i < links.length; i++) {
        treeGrpArr[i] = TREE_GRP.append("g")
            .attr("id", `treeID: ${links[i][0].source.data.treeID}`)
            .attr("transform", `translate(0, ${i * treeH})`);
        treeGrpArr[i]
            .selectAll("path")
            .data(links[i])
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
