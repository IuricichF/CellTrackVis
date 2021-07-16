////////////////// Selection ////////////////////
var selectedHTMLCollectionByTrack = [];
const SELECTED_OPACITY = 1;
const imageSlider = document.getElementById('imageSlider');
function highlightMouseoverTrack() {
    const htmlCollection = document.getElementsByClassName(`${this.getAttribute("class")}`);
    if (selectedHTMLCollectionByTrack !== htmlCollection) {
        for (const item of htmlCollection) {
            item.setAttribute("opacity", SELECTED_OPACITY);
        }
        if (highlightedHTMLCollectionByTree.length === 0) treeGroup.select(`#TrackID${this.getAttribute("class").split("-")[0]}`).attr("stroke", ERR_TRK_COLOR);
    }
}
function unhighlightMouseoutTrack() {
    const htmlCollection = document.getElementsByClassName(`${this.getAttribute("class")}`);
    if (selectedHTMLCollectionByTrack !== htmlCollection) {
        for (const item of htmlCollection) {
            item.setAttribute("opacity", DEFAULT_OPACITY);
        }
        if (highlightedHTMLCollectionByTree.length === 0) treeGroup.select(`#TrackID${this.getAttribute("class").split("-")[0]}`).attr("stroke", treeColor);
    }
}
function selectTrack() {
    const classInfo = this.getAttribute("class").split("-");
    const tempTrkID = +classInfo[0];
    const path = treeGroup.select(`#TrackID${tempTrkID}`).attr("stroke", CORRECT_TRK_COLOR_BEFORE_ERR);
    const pathGroup = d3.select(path.node().parentNode);
    const htmlCollection = document.getElementsByClassName(`${this.getAttribute("class")}`);
    if (selectedHTMLCollectionByTrack === htmlCollection) {
        for (const item of htmlCollection) {
            item.setAttribute("opacity", DEFAULT_OPACITY);
        }
        selectedHTMLCollectionByTrack = [];
        trueTrkGroup.selectAll("path").remove();
        const offset = 6;
        pathGroup
            .selectAll("path")
            .data(links[idxToTreeIDArr.indexOf(+pathGroup.attr("id").slice(6))])
            .attr("d", linkHorizontal)
            .attr("stroke", treeColor)
            .exit()
            .remove();
        drawErrorLinkAndTrack();
    } else {
        for (const item of htmlCollection) {
            item.setAttribute("opacity", SELECTED_OPACITY);
        }
        selectedHTMLCollectionByTrack = htmlCollection;
        imageSlider.value = trkIDToErrImgIdxMap.get(tempTrkID)[classInfo[1]][1];
        updateImage(+imageSlider.value)
        // color the track in lineage tree in two colors
        var pathD = path.attr("d")
        pathD = pathD.split(",");
        pathD[0] = pathD[0].replace("M", "");
        pathD[1] = pathD[1].split("C");
        const startPoint = [[+pathD[0]], [+pathD[1][0]]];
        const endPoint = [[+pathD[pathD.length - 2]], [+pathD[pathD.length - 1]]];
        const tempTrk = trkDataSortedByTrkID.find(d => d[0].trkID === tempTrkID);
        const percent = (trkIDToErrImgIdxMap.get(tempTrkID)[classInfo[1]][0] - tempTrk[0].imgIdx)
            / (tempTrk[tempTrk.length - 1].imgIdx - tempTrk[0].imgIdx);
        const midPoint = [[(endPoint[0] - startPoint[0]) * percent + +startPoint[0]],
        [(endPoint[1] - startPoint[1]) * percent + +startPoint[1]]];
        path.attr("d", d3.line()([startPoint, midPoint]))
        pathGroup.append("path")
            .attr("d", d => d3.line()([midPoint, endPoint]))
            .attr("fill", "none")
            .attr("stroke", CORRECT_TRK_COLOR_AFTER_ERR)
            .attr("stroke-width", lineWidth)
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
    .attr("href", `/DataVis/src/dataset_${datasetIdx}/${imgIdx}.png`)
    .attr("width", resolutionSideLength)
    .attr("height", resolutionSideLength);
// error track 
const errTrkGroup = d3.select("#errorTrack");
const trueTrkGroup = d3.select("#trueTrack");
// update the image
function updateImage(newIdx) {
    imgIdx = newIdx;
    // hardcoding the image file name for now, might change in future
    img.attr("href", `/DataVis/src/dataset_${datasetIdx}/${imgIdx}.png`);
    imgSliderLabel.text(`Image Index: ${imgIdx}`);
    drawErrorLinkAndTrack();
}
const DEFAULT_OPACITY = 0.2;
const OFFSET_TIL_TRK_ID_PATH_CLASSNAME = 10;
const ERR_TRK_COLOR = "red";
const CORRECT_TRK_COLOR_BEFORE_ERR = "green";
const CORRECT_TRK_COLOR_AFTER_ERR = "#6ef562";
const TRK_WIDTH = 10;
const isErrorSelected = (trkID, sec) => {
    if (selectedHTMLCollectionByTrack.length > 0) {
        for (const item of selectedHTMLCollectionByTrack) {
            if (item.attributes.class.value === `${trkID}-${sec}`) return true;
        }
    }
    return false;
}
function drawErrorLinkAndTrack() {
    const pathData = [];
    if (highlightedHTMLCollectionByTree.length === 0) {
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
    else {
        for (const key of trkIDToErrImgIdxMap.keys()) {
            let i = 0;
            const tempPathData = [];
            if (key === +highlightedHTMLCollectionByTree[0].getAttribute("class").split("-")[0]) {
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
    for (let i = 0; i < pathData.length; i++) {
        let group = errTrkGroup.select(`#TrackID${idxToErrTrkIDArr[i]}`);
        if (group.empty()) group = errTrkGroup.append("g").attr("id", `TrackID${idxToErrTrkIDArr[i]}`);
        const circles = group.selectAll("circle")
            .data(pathData[i])
            .attr("cx", d => d[0] ? d[0][0] : undefined)
            .attr("cy", d => d[0] ? d[0][1] : undefined)
            .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
            .attr("fill", (d, ii) => selectedHTMLCollectionByTrack.length > 0 && !isErrorSelected(idxToErrTrkIDArr[i], ii) ? "none" : ERR_TRK_COLOR);
        circles.exit()
            .attr("r", undefined);
        circles.enter()
            .append("circle")
            .attr("class", (d, ii) => `${idxToErrTrkIDArr[i]}-${ii}-errorLink`)
            .attr("cx", d => d[0] ? d[0][0] : undefined)
            .attr("cy", d => d[0] ? d[0][1] : undefined)
            .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
            .attr("opacity", DEFAULT_OPACITY)
            .attr("fill", (d, ii) => selectedHTMLCollectionByTrack.length > 0 && !isErrorSelected(idxToErrTrkIDArr[i], ii) ? "none" : ERR_TRK_COLOR)
            .on("mouseover", highlightMouseoverTrack)
            .on("mouseout", unhighlightMouseoutTrack)
            .on("click", selectTrack);
        const paths = group.selectAll("path")
            .data(pathData[i])
            .attr("d", d => d3.line()(d))
            .attr("stroke", (d, ii) => selectedHTMLCollectionByTrack.length > 0 && !isErrorSelected(idxToErrTrkIDArr[i], ii) ? undefined : ERR_TRK_COLOR);
        paths.exit()
            .attr("d", undefined);
        paths.enter()
            .append("path")
            .attr("class", (d, ii) => `${idxToErrTrkIDArr[i]}-${ii}-errorLink`)
            .attr("d", d => d3.line()(d))
            .attr("fill", "none")
            .attr("stroke", (d, ii) => selectedHTMLCollectionByTrack.length > 0 && !isErrorSelected(idxToErrTrkIDArr[i], ii) ? undefined : ERR_TRK_COLOR)
            .attr("opacity", DEFAULT_OPACITY)
            .attr("stroke-width", TRK_WIDTH)
            .on("mouseover", highlightMouseoverTrack)
            .on("mouseout", unhighlightMouseoutTrack)
            .on("click", selectTrack);
    }

    if (selectedHTMLCollectionByTrack.length > 0) {
        const classInfo = selectedHTMLCollectionByTrack[0].attributes.class.value.split("-");
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
            .attr("stroke", (d, i) => i === 0 ? CORRECT_TRK_COLOR_BEFORE_ERR : CORRECT_TRK_COLOR_AFTER_ERR)
            .attr("stroke-width", TRK_WIDTH)
    }
}

const reset = () => {
    for (const item of selectedHTMLCollectionByTrack) {
        if (item.attributes.opacity) item.attributes.opacity.value = DEFAULT_OPACITY;
    }
    selectedHTMLCollectionByTrack = [];
    highlightedHTMLCollectionByTree = [];
    drawTree();
    trueTrkGroup.selectAll("path").remove();
    drawErrorLinkAndTrack();
}

const showAll = () => {
    imageSlider.value = numImg - 1;
    updateImage(numImg - 1);
}