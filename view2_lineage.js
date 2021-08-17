////////////////// Selection ////////////////////
var previousSeletedTree;
var selectedHTMLCollectionByTree = [];
var highlightedHTMLCollectionByTree = [];
var canTheTreeBeSelected = false;
function highlightMouseoverTree() {
    if (selectedHTMLCollectionByTrack.length === 0) {
        const offset = 7
        const trkID = +this.getAttribute("id").slice(offset);
        const htmlCollection = document.querySelectorAll(`[class^="${trkID}-"]`);
        if (trkIDToErrImgIdxMap.has(trkID)) {
            this.setAttribute("stroke", ERR_TRK_COLOR);
            canTheTreeBeSelected = true;
            if (htmlCollection.length === 0) {
                highlightedHTMLCollectionByTree = [];
                drawErrorLinkAndTrack();
                highlightedHTMLCollectionByTree = document.querySelectorAll(`[class^="${trkID}-"]`);
            } else {
                highlightedHTMLCollectionByTree = htmlCollection;
            }
            drawErrorLinkAndTrack();
        }
    }
}
function unhighlightMouseoutTree() {
    if (selectedHTMLCollectionByTrack.length === 0) {
        const offset = 7
        const trkID = +this.getAttribute("id").slice(offset);
        const htmlCollection = document.querySelectorAll(`[class^="${trkID}-"]`);
        highlightedHTMLCollectionByTree = selectedHTMLCollectionByTree;
        if (JSON.stringify(selectedHTMLCollectionByTree) !== JSON.stringify(htmlCollection)) this.setAttribute("stroke",
            scaleTreeColor(trkIDToErrImgIdxMap.get(trkID).length));
        drawErrorLinkAndTrack();
    }
}
function selectTree() {
    const offset = 7
    const trkID = +this.getAttribute("id").slice(offset);
    const htmlCollection = document.querySelectorAll(`[class^="${trkID}-"]`);
    if (canTheTreeBeSelected) {
        if (JSON.stringify(selectedHTMLCollectionByTree) === JSON.stringify(htmlCollection)) {
            previousSeletedTree = undefined;
            selectedHTMLCollectionByTree = [];
            highlightedHTMLCollectionByTree = [];
        } else {
            previousSeletedTree?.setAttribute("stroke",
                scaleTreeColor(trkIDToErrImgIdxMap.get(+previousSeletedTree.getAttribute("id").slice(offset)).length));
            previousSeletedTree = this;
            imageSlider.value = trkIDToErrImgIdxMap.get(trkID)[trkIDToErrImgIdxMap.get(trkID).length - 1][1];
            updateImage(+imageSlider.value)
            selectedHTMLCollectionByTree = document.querySelectorAll(`[class^="${trkID}-"]`);
            highlightedHTMLCollectionByTree = selectedHTMLCollectionByTree
        }
        drawErrorLinkAndTrack();
    }
}
///////////////// lineage tree zoom ////////////////
var newTreeHeight;
var zmK;
var lineageZm = d3.zoom()
    .on("zoom", d => strechTree(d));
function strechTree(zm) {
    treeGroup.attr("transform", `translate(0, ${zm.transform.y})`);
    if (zm.transform.k != zmK) {
        zmK = zm.transform.k;
        for (let i = 0; i < numTree; i++) {
            newTreeHeight = zm.transform.k * treeHeight;
            links[i] = d3.tree().size([newTreeHeight, treeWidthArr[i]])(roots[i]).links();
            treeGroupArr[i].attr("transform", `translate(0, ${i * newTreeHeight})`);
            treeGroupArr[i]
                .selectAll("path")
                .data(links[i])
                .attr("d", linkHorizontal)
                .attr("stroke-width", scaleZmTolineWidth(zm.transform.k));
        }
        treeGroup.select(`[stroke="${CORRECT_TRK_COLOR_AFTER_ERR}"]`).remove();
        const classInfo = selectedHTMLCollectionByTrack[0].getAttribute("class").split("-");
        colorBranch(treeGroup.select(`#TrackID${classInfo[0]}`), classInfo)
    }
}
////////////////// lineage ////////////////////
const lineageSideLength = 700;
const treeHeight = lineageSideLength / numTree;
lineageZm.scaleExtent([1, lineageSideLength / treeHeight / 2]);
const lineWidth = 3;
const scaleZmTolineWidth = d3.scaleLinear()
    .domain(lineageZm.scaleExtent());
scaleZmTolineWidth.range([lineWidth, Math.log(scaleZmTolineWidth.domain()[1] * lineWidth)]);
const findMaxNumberOfErrorLink = () => {
    let tempArr = [];
    for (const value of trkIDToErrImgIdxMap.values()) {
        tempArr.push(value.length)
    }
    return Math.max(...tempArr)
}
const scaleTreeColor = d3.scaleLinear()
    .domain([0, findMaxNumberOfErrorLink()])
    .range(["white", "black"]);
const lineageSVG = d3.select("#lineageSVG")
    .attr("width", lineageSideLength)
    .attr("height", lineageSideLength)
    .call(lineageZm);
const treeGroup = d3.select("#lineage");
const links = [];
const roots = [];
const inheritanceData = [];
const getLastAppearIdx = (root) => {
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
const setRootDepth = (root) => {
    root.depth = inheritanceData.find(d => d.trkID === root.data.trkID).intvlOfExist[0];
    root.children[0].depth = inheritanceData.find(d => d.trkID === root.data.trkID).intvlOfExist[1] + 1;
    root.children[0].children
        ?.forEach(d => {
            setRootDepth(d);
        })
}
for (i = 0; i < numTrk; i++) {
    let tempTrk = trkData.filter(d => d.trkID === idxToTrkIDArr[i]);
    inheritanceData[i] = new Object();
    // ID
    inheritanceData[i].treeID = tempTrk[0].treeID;
    inheritanceData[i].trkID = tempTrk[0].trkID;
    inheritanceData[i].parentTrkID = tempTrk[0].parentTrkID;
    // it is done to prevent the tree from branching at the very start
    inheritanceData[i].children = [new Object()];
    inheritanceData[i].children[0].children = [];
    // interval of existence
    inheritanceData[i].intvlOfExist = [tempTrk[0].imgIdx, tempTrk[tempTrk.length - 1].imgIdx];
    // if tempTrk is a child of other trk, assign tempTrk as a child to its parent track
    if (tempTrk[0].parentTrkID > 0) {
        let temp = idxToTrkIDArr.indexOf(tempTrk[0].parentTrkID);
        // check if tempTrk is already a child of its parent track
        if (!inheritanceData[temp].children[0].children.includes(inheritanceData[i])) {
            inheritanceData[temp].children[0].children.push(inheritanceData[i]);
        }
    }
}
const scaleIMGIdxToLineageWidth = d3.scaleLinear()
    .domain([0, numImg - 1])
    .range([0, lineageSideLength]);
// set up roots and links
const treeWidthArr = [];
for (let i = 0; i < numTree; i++) {
    // get root track info
    let tempTrack = inheritanceData.find(d => d.treeID === idxToTreeIDArr[i] && d.parentTrkID === 0);
    // set width of the tree to the lineage point of last appear frame
    treeWidthArr[i] = scaleIMGIdxToLineageWidth(getLastAppearIdx(tempTrack));
    let treeLayout = d3.tree().size([treeHeight, treeWidthArr[i]]);
    // set root
    roots[i] = d3.hierarchy(tempTrack);
    // customize the tree
    setRootDepth(roots[i]);
    // generate link
    links[i] = treeLayout(roots[i]).links();
}
const linkHorizontal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
const treeGroupArr = [];
// draw trees using information from links
const drawTree = () => {
    /*    treeGroup.selectAll("g").remove();*/
    for (let i = 0; i < links.length; i++) {
        treeGroupArr[i] = treeGroup.append("g")
            .attr("id", `TreeID${links[i][0].source.data.treeID}`)
            .attr("transform", `translate(0, ${i * treeHeight})`);
        treeGroupArr[i]
            .selectAll("path")
            .data(links[i])
            .enter()
            .append("path")
            .attr("id", d => `TrackID${d.source.data.trkID}`)
            .attr("d", linkHorizontal)
            .attr("fill", "none")
            .attr("stroke", d => trkIDToErrImgIdxMap.get(+d.source.data.trkID) ?
                scaleTreeColor(trkIDToErrImgIdxMap.get(+d.source.data.trkID)?.length)
                : "#60A5FA")
            .attr("stroke-width", d => trkIDToErrImgIdxMap.get(+d.source.data.trkID) ? lineWidth : 2)
            .style("stroke-dasharray", d => trkIDToErrImgIdxMap.get(+d.source.data.trkID) ? "none" : ("5,2"))
            .on("mouseover", highlightMouseoverTree)
            .on("mouseout", unhighlightMouseoutTree)
            .on("click", selectTree);
    }
}
drawTree();
