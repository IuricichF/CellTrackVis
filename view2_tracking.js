// constants and variables
const defOpacity = 0.2;
const highlightedOpacity = 1;
const trkWidth = 10;
const errLinkCircleRadius = trkWidth * 1.5;
const correctTrkColorBe4Err = /*"green"*/"#6ef562";
const correctTrkColorAfterErr = /*"#6ef562"*/"blue";
const errLinkClassNamePrefix = "TrackID";
const errLinkColor = "red";
var classNameOfSelectedErrorLink = undefined;
var imgIdxBe4SelectErrLink = undefined;
// functions
const setCollectionToDefaultOpacity = (htmlCollection) => {
    for (const item of htmlCollection) {
        item.setAttribute("opacity", defOpacity);
    }
}
const setCollectionToHighlightedOpacity = (htmlCollection) => {
    for (const item of htmlCollection) {
        item.setAttribute("opacity", highlightedOpacity);
    }
}
const getCollectionByClassName = (className) => document.getElementsByClassName(className);
const isAnErrorLinkSelected = () => classNameOfSelectedErrorLink !== undefined;
const isThisErrorLinkSelected = (className) => classNameOfSelectedErrorLink === className;
const setSelectedErrorLink = (className) => classNameOfSelectedErrorLink = className;
const unsetSelectedErrorLink = () => classNameOfSelectedErrorLink = undefined;
const updateTracking = (newIdx) => {
    imgIdx = newIdx;
    img.attr("href", `/src/dataset_${datasetIdx}/${imgIdx}.png`);
    // set slider
    imageSlider.value = newIdx;
    imgSliderLabel.text(`Image Index: ${imgIdx}`);
    // set error links and tracks
    drawErrorLinksAndTracks();
}
const removeTrueTrack = () => trueTrkGroup.selectAll("path").remove();
const reset = () => {
    if (isAnErrorLinkSelected()) {
        setCollectionToDefaultOpacity(getCollectionByClassName(classNameOfSelectedErrorLink))
        unsetColorOfTreeBranchToUnselected(+classNameOfSelectedErrorLink.split("-")[0]);
        unsetSelectedErrorLink();
    }
    if (isATreeBranchSelected()) {
        unsetColorOfTreeBranchToUnselected(trackIDOfSelectedTreeBranch);
        unsetSelectedTreeBranch();
        unsetClickedOnTreeBranch();
    }
    removeTrueTrack();
    updateTracking(0);
}
const showAll = () => {
    reset();
    updateTracking(numImg - 1);
}
////////////////// Selection ////////////////////
function highlightErrorLinkWhenMouseover() {
    const className = this.getAttribute("class");
    if (!isThisErrorLinkSelected(className)) {
        setCollectionToHighlightedOpacity(getCollectionByClassName(className))
        setColorOfTreeBranchToSelected(+className.split("-")[0])
    }
}
function unhighlightErrorLinkWhenMouseout() {
    const className = this.getAttribute("class");
    if (!isThisErrorLinkSelected(className)) {
        setCollectionToDefaultOpacity(getCollectionByClassName(className))
        const trkID = +className.split("-")[0]
        if (!isThisTreeBranchClickedOn(trkID)) unsetColorOfTreeBranchToUnselected(trkID)
    }
}
function selectErrorLinkWhenClick() {
    const className = this.getAttribute("class");
    const collection = getCollectionByClassName(className);
    const trkID = +className.split("-")[0];
    const secID = +className.split("-")[1];
    if (isThisErrorLinkSelected(className)) {
        unsetSelectedErrorLink();
        removeTrueTrack();
        if (isATreeBranchClickedOn()) setColorOfTreeBranchToSelected(trackIDOfClickedOnTreeBranch);
        else unsetColorOfTreeBranchToUnselected(trkID);
        updateTracking(imgIdxBe4SelectErrLink);
    } else {
        setSelectedErrorLink(className)
        setCollectionToHighlightedOpacity(collection)
        imgIdxBe4SelectErrLink = imgIdx;
        updateTracking(+trkIDToErrImgIdxMap.get(trkID)[secID][1]);
        colorTreeBranch(trkID, secID);
    }
}
////////////////// tracking ////////////////////
const imgSlider = d3.select("#imageSlider")
    .attr("max", numImg - 1);
const imgSliderLabel = d3.select("#imageSliderLabel");
var imgIdx = 0;
// image info
const resolutionSideLength = 2040;
const sVGSideLength = 700;
// set up the svg that will contain image and tracks
const imgSVG = d3.select("#trackingSVG")
    .attr("width", sVGSideLength)
    .attr("height", sVGSideLength)
    .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`);
// image
const img = d3.select("#image")
    .attr("href", `/src/dataset_${datasetIdx}/${imgIdx}.png`)
    .attr("width", resolutionSideLength)
    .attr("height", resolutionSideLength);
// error track 
const errLinkGroup = d3.select("#errorLink");
const trueTrkGroup = d3.select("#trueTrack");
const drawErrorLinksAndTracks = () => {
    const pathData = [];
    if (isATreeBranchSelected()) {
        for (const key of trkIDToErrImgIdxMap.keys()) {
            let i = 0;
            const tempPathData = [];
            if (key === trackIDOfSelectedTreeBranch) {
                for (const value of trkIDToErrImgIdxMap.get(key)) {
                    const temp = value.filter(d => d <= imgIdx);
                    if (temp.length > 0) {
                        temp.length === 1 ? tempPathData.push([trkIDToErrPathMap.get(key)[i][0]])
                            : tempPathData.push(trkIDToErrPathMap.get(key)[i])
                    }
                    i++;
                }
            }
            pathData.push(tempPathData);
        }
    }
    else {
        for (const key of trkIDToErrImgIdxMap.keys()) {
            let i = 0;
            const tempPathData = [];
            for (const value of trkIDToErrImgIdxMap.get(key)) {
                const temp = value.filter(d => d <= imgIdx);
                if (temp.length > 0) {
                    temp.length === 1 ? tempPathData.push([trkIDToErrPathMap.get(key)[i][0]])
                        : tempPathData.push(trkIDToErrPathMap.get(key)[i])
                }
                i++;
            }
            pathData.push(tempPathData);
        }
    }
    for (let i = 0; i < pathData.length; i++) {
        let group = errLinkGroup.select(`#TrackID${idxToErrTrkIDArr[i]}`);
        if (group.empty()) group = errLinkGroup.append("g").attr("id", `TrackID${idxToErrTrkIDArr[i]}`);
        const circles = group.selectAll("circle")
            .data(pathData[i])
            .attr("cx", d => d[0] ? d[0][0] : undefined)
            .attr("cy", d => d[0] ? d[0][1] : undefined)
            .attr("r", d => d[0] ? errLinkCircleRadius : undefined)
            .attr("fill", (d, ii) => isAnErrorLinkSelected() && !isThisErrorLinkSelected(`${idxToErrTrkIDArr[i]}-${ii}`)
                ? "none" : errLinkColor);
        circles.exit()
            .attr("r", undefined);
        circles.enter()
            .append("circle")
            .attr("class", (d, ii) => `${idxToErrTrkIDArr[i]}-${ii}`)
            .attr("cx", d => d[0] ? d[0][0] : undefined)
            .attr("cy", d => d[0] ? d[0][1] : undefined)
            .attr("r", d => d[0] ? errLinkCircleRadius : undefined)
            .attr("opacity", defOpacity)
            .attr("fill", (d, ii) => isAnErrorLinkSelected() && !isThisErrorLinkSelected(`${idxToErrTrkIDArr[i]}-${ii}`)
                ? "none" : errLinkColor)
            .on("mouseover", highlightErrorLinkWhenMouseover)
            .on("mouseout", unhighlightErrorLinkWhenMouseout)
            .on("click", selectErrorLinkWhenClick);
        const paths = group.selectAll("path")
            .data(pathData[i])
            .attr("d", d => d3.line()(d))
            .attr("stroke", (d, ii) => isAnErrorLinkSelected() && !isThisErrorLinkSelected(`${idxToErrTrkIDArr[i]}-${ii}`)
                ? undefined : errLinkColor);
        paths.exit()
            .attr("d", undefined);
        paths.enter()
            .append("path")
            .attr("class", (d, ii) => `${idxToErrTrkIDArr[i]}-${ii}`)
            .attr("d", d => d3.line()(d))
            .attr("fill", "none")
            .attr("stroke", (d, ii) => isAnErrorLinkSelected() && !isThisErrorLinkSelected(`${idxToErrTrkIDArr[i]}-${ii}`)
                ? undefined : errLinkColor)
            .attr("opacity", defOpacity)
            .attr("stroke-width", trkWidth)
            .on("mouseover", highlightErrorLinkWhenMouseover)
            .on("mouseout", unhighlightErrorLinkWhenMouseout)
            .on("click", selectErrorLinkWhenClick);
    }

    if (isAnErrorLinkSelected()) {
        const classInfo = getCollectionByClassName(classNameOfSelectedErrorLink)[0].attributes.class.value.split("-");
        const tempID = +classInfo[0];
        const tempTrk = trkDataSortedByTrkID.find(d => d[0].trkID === tempID).filter(d => d.imgIdx <= imgIdx)
        const tempPathData = [[], []];
        for (const point of tempTrk) {
            point.imgIdx <= trkIDToErrImgIdxMap.get(tempID)[classInfo[1]][0] ? tempPathData[0].push([point.x, point.y])
                : tempPathData[1].push([point.x, point.y])
        }
        tempPathData[1].unshift(trkIDToErrPathMap.get(tempID)[classInfo[1]][0]);
        const tempPath = trueTrkGroup.selectAll("path")
            .data(tempPathData)
            .attr("d", d => d3.line()(d))
        tempPath.exit()
            .attr("d", undefined)
        tempPath.enter()
            .append("path")
            .attr("d", d => d3.line()(d))
            .attr("fill", "none")
            .attr("stroke", (d, i) => i === 0 ? correctTrkColorBe4Err : correctTrkColorAfterErr)
            .attr("stroke-width", trkWidth)
    }
}