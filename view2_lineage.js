// constants and variables
const TreeClassNamePrefix = "TreeID";
const corrTreeBranchColor = "#6ef562";
const lineageSideLength = 700;
const defNumTreeInAPage = 20;
const treeHeight = lineageSideLength / defNumTreeInAPage;
const lineWidth = 3;

const initLineage = function() {
    var trackIDOfClickedOnTreeBranch = undefined;
    var trackIDOfSelectedTreeBranch = undefined;
    var newTreeHeight;
    var zmK;
    var lineageZm = d3.zoom()
        .on("zoom", d => strechTree(d));
    lineageZm.scaleExtent([1, lineageSideLength / treeHeight / 2]);
    const scaleZmTolineWidth = d3.scaleLinear()
        .domain(lineageZm.scaleExtent());
    const scaleIMGIdxToLineageWidth = d3.scaleLinear()
        .domain([0, numImg - 1])
        .range([0, lineageSideLength]);
    scaleZmTolineWidth.range([lineWidth, Math.log(scaleZmTolineWidth.domain()[1] * lineWidth)]);
    // function
    const isATreeBranchSelected = () => trackIDOfSelectedTreeBranch !== undefined;
    const isATreeBranchClickedOn = () => trackIDOfClickedOnTreeBranch !== undefined;
    const isThisTreeBranchClickedOn = (trkID) => trackIDOfClickedOnTreeBranch === trkID;
    const getErrorLinksByTrackID = (trkID) => document.querySelectorAll(`[class^="${trkID}-"]`);
    const DoesThisTrackContainsError = (trkID) => trkIDToErrImgIdxMap.has(trkID);
    const getNumberOfErrorInThisTrack = (trkID) => trkIDToErrImgIdxMap.get(trkID).length;
    const setColorOfTreeBranchToSelected = (trkID) => {
        treeGroup.select(`#${errLinkClassNamePrefix}${trkID}`).attr("stroke", errLinkColor);
        // remove colored branch
        treeGroup.select(`[stroke="${correctTrkColorAfterErr}"]`).remove();
    }
    const unsetColorOfTreeBranchToUnselected = (trkID) => {
        treeGroup.select(`#${errLinkClassNamePrefix}${trkID}`)
            .attr("stroke", scaleColorByErrNum(getNumberOfErrorInThisTrack(trkID)));
        // remove colored branch
        treeGroup.select(`[stroke="${correctTrkColorAfterErr}"]`).remove();
    }
    const setSelectedTreeBranch = (trkID) => trackIDOfSelectedTreeBranch = trkID;
    const unsetSelectedTreeBranch = () => trackIDOfSelectedTreeBranch = undefined;
    const getSelectedTreeBranch = () => trackIDOfSelectedTreeBranch;
    const setClickedOnTreeBranch = (trkID) => trackIDOfClickedOnTreeBranch = trkID;
    const unsetClickedOnTreeBranch = () => trackIDOfClickedOnTreeBranch = undefined;
    const getClickedOnTreeBranch = () => trackIDOfClickedOnTreeBranch;
    const colorTreeBranch = (trkID, secID) => {
        const path = treeGroup.select(`#TrackID${trkID}`)
            .attr("stroke", correctTrkColorBe4Err);
        var pathD = path.attr("d")
        pathD = pathD.split(",");
        pathD[0] = pathD[0].replace("M", "");
        pathD[1] = pathD[1].split("C");
        const startPoint = [[+pathD[0]], [+pathD[1][0]]];
        const endPoint = [[+pathD[pathD.length - 2]], [+pathD[pathD.length - 1]]];
        const tempTrk = trkDataSortedByTrkID.find(d => d[0].trkID === trkID);
        const percent = (trkIDToErrImgIdxMap.get(trkID)[secID][0] - tempTrk[0].imgIdx)
            / (tempTrk[tempTrk.length - 1].imgIdx - tempTrk[0].imgIdx);
        const midPoint = [[(endPoint[0] - startPoint[0]) * percent + +startPoint[0]],
        [(endPoint[1] - startPoint[1]) * percent + +startPoint[1]]];
        d3.select(path.node().parentNode).append("path")
            .attr("d", d => d3.line()([midPoint, endPoint]))
            .attr("fill", "none")
            .attr("stroke", correctTrkColorAfterErr)
            .attr("stroke-width", lineWidth)
    }
    ////////////////// Selection ////////////////////
    function selectTreeBranchWhenMouseover() {
        if (!initTracking.isAnErrorLinkSelected()) {
            const trkID = +this.getAttribute("id").slice(errLinkClassNamePrefix.length);
            if (DoesThisTrackContainsError(trkID)) {
                setSelectedTreeBranch(trkID);
                setColorOfTreeBranchToSelected(trkID);
                if (isATreeBranchClickedOn() && !isThisTreeBranchClickedOn(trkID)) {
                    unsetColorOfTreeBranchToUnselected(trackIDOfClickedOnTreeBranch);
                } 
                initTracking.drawErrorLinksAndTracks();
            }
        }
    }
    
    function unselectTreeBranchWhenMouseout() {
        if (!initTracking.isAnErrorLinkSelected()) {
            const trkID = +this.getAttribute("id").slice(errLinkClassNamePrefix.length);
            if (DoesThisTrackContainsError(trkID)) {
                setSelectedTreeBranch(trackIDOfClickedOnTreeBranch);
                if (isATreeBranchClickedOn()) setColorOfTreeBranchToSelected(trackIDOfClickedOnTreeBranch);
                if (!isThisTreeBranchClickedOn(trkID)) unsetColorOfTreeBranchToUnselected(trkID);
                initTracking.drawErrorLinksAndTracks();
            }
        }
    }
    
    function selectTreeBranchWhenClickedOn() {
        const trkID = +this.getAttribute("id").slice(errLinkClassNamePrefix.length);
        if (DoesThisTrackContainsError(trkID)) {
            if (isThisTreeBranchClickedOn(trkID)) {
                unsetClickedOnTreeBranch();
                unsetSelectedTreeBranch();
                unsetColorOfTreeBranchToUnselected(trkID);
                initTracking.updateTracking(initTracking.getImageIndex());
            } else {
                setSelectedTreeBranch(trkID)
                setClickedOnTreeBranch(trkID);
                setColorOfTreeBranchToSelected(trkID);
                // once clicked, jump to the image index that all the error links in the tree branch have occured
                // if it greater than current image index
                const tempIdx = +trkIDToErrImgIdxMap.get(trkID)[trkIDToErrImgIdxMap.get(trkID).length - 1][1];
                initTracking.updateTracking(tempIdx > initTracking.getImageIndex() ? tempIdx : initTracking.getImageIndex());
            }
        }
    }
    ///////////////// lineage tree zoom ////////////////
    function strechTree(zm) {
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
            // zooming the colored tree branch
            if (initTracking.isAnErrorLinkSelected()) {
                treeGroup.select(`[stroke="${correctTrkColorAfterErr}"]`).remove();
                const classInfo = initTracking.getSelectedErrorLink().split("-");
                colorTreeBranch(+classInfo[0], +classInfo[1]);
            }
    
            lineageSVG.attr("height", newTreeHeight * numTree)
        }
    }
    ////////////////// lineage ////////////////////
    const findMaxNumberOfErrorLink = () => {
        let tempArr = [];
        for (const value of trkIDToErrImgIdxMap.values()) {
            tempArr.push(value.length)
        }
        return Math.max(...tempArr)
    }
    const scaleColorByErrNum = d3.scaleLinear()
        .domain([0, findMaxNumberOfErrorLink()])
        .range(["white", "black"]);
    const lineageSVG = d3.select("#lineageSVG")
        .attr("width", lineageSideLength)
        .attr("height", treeHeight * numTree);
    /*    .call(lineageZm);*/
    const treeGroup = d3.select("#lineage");
    const links = [];
    const roots = [];
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
    
    const getInheritanceData = (idxToTrkIDArr) => {
        const retData = [];
        for (let i = 0; i < idxToTrkIDArr.length; i++) {
            let tempTrk = trkData.filter(d => d.trkID === idxToTrkIDArr[i]);
            retData[i] = new Object();
            // ID
            retData[i].treeID = tempTrk[0].treeID;
            retData[i].trkID = tempTrk[0].trkID;
            retData[i].parentTrkID = tempTrk[0].parentTrkID;
            // it is done to prevent the tree from branching at the very start
            retData[i].children = [new Object()];
            retData[i].children[0].children = [];
            // interval of existence
            retData[i].intvlOfExist = [tempTrk[0].imgIdx, tempTrk[tempTrk.length - 1].imgIdx];
            // if tempTrk is a child of other trk, assign tempTrk as a child to its parent track
            try {
                if (tempTrk[0].parentTrkID > 0) {
                    let temp = idxToTrkIDArr.indexOf(tempTrk[0].parentTrkID);
                    // check if tempTrk is already a child of its parent track
                    if (!retData[temp].children[0].children.includes(retData[i])) {
                        retData[temp].children[0].children.push(retData[i]);
                    }
                }
            } catch {
                console.log(`The track ${tempTrk[0].trkID} ` + 
                    `has a non-exist parent track of ${tempTrk[0].parentTrkID} ` +
                    `(tree id: ${tempTrk[0].treeID})`);
            }
        }
        return retData;
    }
    let tempInheritanceData = getInheritanceData(idxToTrkIDWithErrArr);
    const inheritanceData = tempInheritanceData.concat(getInheritanceData(idxToTrkIDNoErrArr));
    // sort the trees by the number of error links each contains
    idxToTreeIDWithErrArr.sort((a, b) => {
        const tree1 = trkData.filter(d => d.treeID === a);
        const trkIDArrOfT1 = [];
        tree1.forEach(d => {
            if (!trkIDArrOfT1.includes(d.trkID)) trkIDArrOfT1.push(d.trkID);
        })
        const tree2 = trkData.filter(d => d.treeID === b);
        const trkIDArrOfT2 = [];
        tree2.forEach(d => {
            if (!trkIDArrOfT2.includes(d.trkID)) trkIDArrOfT2.push(d.trkID);
        })
        var val1 = 0;
        trkIDArrOfT1.forEach(d => val1 += DoesThisTrackContainsError(d) ? getNumberOfErrorInThisTrack(d) : 0);
        var val2 = 0;
        trkIDArrOfT2.forEach(d => val2 += DoesThisTrackContainsError(d) ? getNumberOfErrorInThisTrack(d) : 0);
    
        return val2 - val1;
    })
    // set up roots and links
    const treeWidthArr = [];
    for (let i = 0; i < numTreeWithErr; i++) {
        try {
            // get root track info
            let tempTrack = inheritanceData.find(d => d.treeID === idxToTreeIDWithErrArr[i] && d.parentTrkID === 0);
            // set width of the tree to the lineage point of last appear frame
            treeWidthArr[i] = scaleIMGIdxToLineageWidth(getLastAppearIdx(tempTrack));
            let treeLayout = d3.tree().size([treeHeight, treeWidthArr[i]]);
            // set root
            roots[i] = d3.hierarchy(tempTrack);
            // customize the tree
            setRootDepth(roots[i]);
            // generate link
            links[i] = treeLayout(roots[i]).links();
        } catch {
            console.log(`Failed to compute tree ${idxToTreeIDWithErrArr[i]}`)
        }
    }
    for (let i = numTreeWithErr; i < numTree; i++) {
        try {
            // get root track info
            let tempTrack = inheritanceData.find(d => d.treeID === idxToTreeIDNoErrArr[i - numTreeWithErr] && d.parentTrkID === 0);
            // set width of the tree to the lineage point of last appear frame
            treeWidthArr[i] = scaleIMGIdxToLineageWidth(getLastAppearIdx(tempTrack));
            let treeLayout = d3.tree().size([treeHeight, treeWidthArr[i]]);
            // set root
            roots[i] = d3.hierarchy(tempTrack);
            // customize the tree
            setRootDepth(roots[i]);
            // generate link
            links[i] = treeLayout(roots[i]).links();
        } catch {
            console.log(`Failed to compute tree ${idxToTreeIDNoErrArr[i - numTreeWithErr]}`)
        }
    }
    const linkHorizontal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
    const treeGroupArr = [];
    // draw trees using information from links
    const drawTrees = function() {
        for (let i = 0; i < links.length; i++) {
            try {
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
                        scaleColorByErrNum(trkIDToErrImgIdxMap.get(+d.source.data.trkID)?.length)
                        : corrTreeBranchColor)
                    .attr("stroke-width", d => trkIDToErrImgIdxMap.get(+d.source.data.trkID) ? lineWidth : 2)
                    .style("stroke-dasharray", d => trkIDToErrImgIdxMap.get(+d.source.data.trkID) ? "none" : ("5,2"))
                    .on("mouseover", selectTreeBranchWhenMouseover)
                    .on("mouseout", unselectTreeBranchWhenMouseout)
                    .on("click", selectTreeBranchWhenClickedOn);
            } catch {
                console.log("Failed to build tree " + 
                `${(i < numTreeWithErr) ? idxToTreeIDWithErrArr[i] : idxToTreeIDNoErrArr[i - numTreeWithErr]}`);
            }
        }
    }()
    return {
        isATreeBranchSelected: isATreeBranchSelected,
        isATreeBranchClickedOn: isATreeBranchClickedOn,
        isThisTreeBranchClickedOn: isThisTreeBranchClickedOn,
        getErrorLinksByTrackID: getErrorLinksByTrackID,
        DoesThisTrackContainsError: DoesThisTrackContainsError,
        getNumberOfErrorInThisTrack: getNumberOfErrorInThisTrack,
        setColorOfTreeBranchToSelected: setColorOfTreeBranchToSelected,
        unsetColorOfTreeBranchToUnselected: unsetColorOfTreeBranchToUnselected,
        setSelectedTreeBranch: setSelectedTreeBranch,
        unsetSelectedTreeBranch: unsetSelectedTreeBranch,
        getSelectedTreeBranch: getSelectedTreeBranch,
        setClickedOnTreeBranch: setClickedOnTreeBranch,
        unsetClickedOnTreeBranch: unsetClickedOnTreeBranch,
        getClickedOnTreeBranch: getClickedOnTreeBranch,
        colorTreeBranch: colorTreeBranch
    }
}()
