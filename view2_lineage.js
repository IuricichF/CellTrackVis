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
            .attr("id", `Tree ID: ${links[i][0].source.data.treeID}`)
            .attr("transform", `translate(0, ${i * treeHeight})`);
        group
            .selectAll("path")
            .data(links[i])
            .enter()
            .append("path")
            .attr("class", d => `Track ID: ${d.source.data.trkID}`)
            .attr("d", linkHorizontal)
            .attr("fill", "none")
            .attr("stroke", treeColor)
            .attr("stroke-width", lineWidth)
    }
}
drawTree();
const hideUnselectedTree = (treeID) => {
    const offset = 9;
    let i = 0;
    for (const group of treeGroup.selectAll("g")) {
        const tempID = +group.id.slice(offset)
        if (tempID !== treeID) group.remove();
        else {
            const tempTrack = inheritanceData.find(d => d.treeID === idxToTreeIDArr[i] && d.parentTrkID === 0);
            const tempWidth = scaleIMGIdxToLineageWidth(getLastAppearIdx(tempTrack));
            const treeLayout = d3.tree().size([lineageSideLength / 2, tempWidth]);
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
const drawErrorTree = (trkIDPred) => {
    const treeID = trkData.find(d => d.trkIDPred === trkIDPred).treeID;
    const TrkDataWithTheTreeID = trkData.filter(d => d.treeID === treeID);
    TrkDataWithTheTreeID[0].parentTrkID = -1;
    const tempIdxToTrkIDPredArr = [TrkDataWithTheTreeID[0].trkIDPred];
    for (let i = 1; i < TrkDataWithTheTreeID.length; i++) {
        if (!tempIdxToTrkIDPredArr.includes(TrkDataWithTheTreeID[i].trkIDPred)) {
            tempIdxToTrkIDPredArr.push(TrkDataWithTheTreeID[i].trkIDPred);
            break;
        }
    }
    console.log(tempIdxToTrkIDPredArr)
    console.log(TrkDataWithTheTreeID)
    const tempInheritanceData = [];
    for (i = 0; i < tempIdxToTrkIDPredArr.length; i++) {
        let tempTrk = TrkDataWithTheTreeID.filter(d => d.trkIDPred === tempIdxToTrkIDPredArr[i]);
        tempInheritanceData[i] = new Object();
        // ID
        tempInheritanceData[i].treeID = tempTrk[0].treeID;
        tempInheritanceData[i].trkID = tempTrk[0].trkID;
        tempInheritanceData[i].parentTrkID = tempTrk[0].parentTrkID;
        // it is done to prevent the tree from branching at the very start
        tempInheritanceData[i].children = [new Object()];
        tempInheritanceData[i].children[0].children = [];
        // interval of existence
        tempInheritanceData[i].intvlOfExist = [tempTrk[0].imgIdx, tempTrk[tempTrk.length - 1].imgIdx];
        // if tempTrk is a child of other trk, assign tempTrk as a child to its parent track
        if (tempInheritanceData[i].parentTrkID !== -1) {
            const tempIdx = tempInheritanceData.findIndex(d => d.intvlOfExist[1] === tempInheritanceData[i].intvlOfExist[0] - 1);
            tempInheritanceData[tempIdx].children[0].children.push(tempInheritanceData[i]);
        }
    }
    console.log(tempInheritanceData)
    // get root track info
    const tempTrack = tempInheritanceData.find(d => d.intvlOfExist[0] === 0);
    // set width of the tree to the lineage point of last appear frame
    const tempWidth = scaleIMGIdxToLineageWidth(getLastAppearIdx(tempTrack));
    const treeLayout = d3.tree().size([lineageSideLength / 2, tempWidth]);
    // set root
    const tempRoot = d3.hierarchy(tempTrack);
    // customize the tree
    setRootDepth(tempRoot);
    // generate link
    const tempLink = treeLayout(tempRoot).links();
    const group = treeGroup.append("g")
        .attr("id", "errorTree")
        .attr("transform", `translate(0, ${lineageSideLength / 2})`);
    group
        .selectAll("path")
        .data(tempLink)
        .enter()
        .append("path")
        .attr("id", (d, i) => i)
        .attr("d", linkHorizontal)
        .attr("fill", "none")
        .attr("stroke", treeColor)
        .attr("stroke-width", lineWidth)
    
}