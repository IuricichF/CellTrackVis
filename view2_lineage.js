const lineageSideLength = 700;
const lineWidth = 3;
const treeColor = "black";
const treeHeight = lineageSideLength / numTree;
const lineageSVG = d3.select("#lineageSVG")
    .attr("width", lineageSideLength)
    .attr("height", lineageSideLength);
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
for (let i = 0; i < numTree; i++) {
    // get root track info
    let tempTrack = inheritanceData.find(d => d.treeID === idxToTreeIDArr[i] && d.parentTrkID === 0);
    // set width of the tree to the lineage point of last appear frame
    let tempWidth = scaleIMGIdxToLineageWidth(getLastAppearIdx(tempTrack));
    let treeLayout = d3.tree().size([treeHeight, tempWidth]);
    // set root
    roots[i] = d3.hierarchy(tempTrack);
    // customize the tree
    setRootDepth(roots[i]);
    // generate link
    links[i] = treeLayout(roots[i]).links();
}
const linkHorizontal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
// draw trees using information from links
const drawTree = () => {
    treeGroup.selectAll("g").remove();
    for (let i = 0; i < links.length; i++) {
        const group = treeGroup.append("g")
            .attr("id", `TreeID${links[i][0].source.data.treeID}`)
            .attr("transform", `translate(0, ${i * treeHeight})`);
        group
            .selectAll("path")
            .data(links[i])
            .enter()
            .append("path")
            .attr("id", d => `TrackID${d.source.data.trkID}`)
            .attr("d", linkHorizontal)
            .attr("fill", "none")
            .attr("stroke", treeColor)
            .attr("stroke-width", lineWidth)
    }
}
drawTree();
const hideUnselectedTree = (treeID) => {
    const offset = 6;
    let i = 0;
    for (const group of treeGroup.selectAll("g")) {
        const tempID = +group.id.slice(offset)
        if (tempID !== treeID) group.remove();
        else {
            const tempTrack = inheritanceData.find(d => d.treeID === idxToTreeIDArr[i] && d.parentTrkID === 0);
            const tempWidth = scaleIMGIdxToLineageWidth(getLastAppearIdx(tempTrack));
            const treeLayout = d3.tree().size([lineageSideLength, tempWidth]);
            const tempRoot = d3.hierarchy(tempTrack);
            setRootDepth(tempRoot);
            const templink = treeLayout(tempRoot).links();
            d3.select(group)
                .selectAll("path")
                .data(templink)
                .attr("d", linkHorizontal);
        }
        i++;
    }
    treeGroup.select("g").attr("transform", undefined);
}

