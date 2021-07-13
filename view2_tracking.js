////////////////// Selection ////////////////////
var seletedHTMLCollection;
const SELECTED_OPACITY = 1;
function highlight() {
    const htmlCollection = document.getElementsByClassName(`${this.getAttribute("class")}`);
    if (seletedHTMLCollection != htmlCollection) {
        for (const item of htmlCollection) {
            if (item.attributes.opacity) item.attributes.opacity.value = SELECTED_OPACITY;
        }
    }
}
function unhighlight() {
    const htmlCollection = document.getElementsByClassName(`${this.getAttribute("class")}`);
    if (seletedHTMLCollection != htmlCollection) {
        for (const item of htmlCollection) {
            if (item.attributes.opacity) item.attributes.opacity.value = DEFAULT_OPACITY;
        }
    }
}
function selectTrack() {
    const htmlCollection = document.getElementsByClassName(`${this.getAttribute("class")}`);
    if (seletedHTMLCollection === htmlCollection) {
        for (const item of htmlCollection) {
            if (item.attributes.opacity) item.attributes.opacity.value = DEFAULT_OPACITY;
        }
        seletedHTMLCollection = undefined;
        trueTrkGroup.selectAll("path").remove();
        drawTree();
    } else {
        for (const item of htmlCollection) {
            if (item.attributes.opacity) item.attributes.opacity.value = SELECTED_OPACITY;
        }
        seletedHTMLCollection = htmlCollection;
        const offset = 10;
        const tempTrkID = +this.getAttribute("class").slice(offset);
        hideUnselectedTree(trkData.find(d => d.trkID === tempTrkID).treeID);
        const idxLineageTrk = 2;
        htmlCollection[idxLineageTrk].attributes.stroke.value = CORRECT_TRK_COLOR_BEFORE_ERR;
        const path = d3.select(htmlCollection[idxLineageTrk]);
        var pathD = path.attr("d")
        pathD = pathD.split(",");
        pathD[0] = pathD[0].replace("M", "");
        pathD[1] = pathD[1].split("C");
        const startPoint = [[+pathD[0]], [+pathD[1][0]]];
        const endPoint = [[+pathD[pathD.length - 2]], [+pathD[pathD.length - 1]]];
        const tempTrk = trkDataSortedByTrkID.find(d => d[0].trkID === tempTrkID);
        const percent = (trkIDToErrImgIdxMap.get(tempTrkID)[0] - tempTrk[0].imgIdx)
            / (tempTrk[tempTrk.length - 1].imgIdx - tempTrk[0].imgIdx);
        const midPoint = [[(endPoint[0] - startPoint[0]) * percent + +startPoint[0]],
            [(endPoint[1] - startPoint[1]) * percent + +startPoint[1]]];
        path.attr("d", d3.line()([startPoint, midPoint]))
        d3.select("#lineage").select("g").append("path")
            .attr("d", d => d3.line()([midPoint, endPoint]))
            .attr("fill", "none")
            .attr("stroke", CORRECT_TRK_COLOR_AFTER_ERR)
            .attr("stroke-width", lineWidth)
/*        drawErrorTree(trkData.find(d => d.trkID === tempTrkID).trkIDPred);*/
    }
    drawErrorTrack();
}
////////////////// image ////////////////////
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
    drawErrorTrack();
}
const DEFAULT_OPACITY = 0.6;
const OFFSET_TIL_TRK_ID_PATH_CLASSNAME = 10;
const ERR_TRK_COLOR = "red";
const CORRECT_TRK_COLOR_BEFORE_ERR = "green";
const CORRECT_TRK_COLOR_AFTER_ERR = "#6ef562";
const TRK_WIDTH = 10;
const isTrkSelected = (trkID) => {
    if (seletedHTMLCollection) {
        for (const item of seletedHTMLCollection) {
            if (item.attributes.class.value === `Track ID: ${trkID}`) return true;
        }
    }
    return false;
}
function drawErrorTrack() {
    const pathData = [];
    for (const key of trkIDToErrImgIdxMap.keys()) {
        const temp = trkIDToErrImgIdxMap.get(key).filter(d => d <= imgIdx);
        if (temp.length > 0) {
            temp.length === 1 ? pathData.push([trkIDToErrPathMap.get(key)[0]])
                : pathData.push(trkIDToErrPathMap.get(key))
        } else {
            pathData.push([]);
        }
    }
    const circles = errTrkGroup.selectAll("circle")
        .data(pathData)
        .attr("cx", d => d[0] ? d[0][0] : undefined)
        .attr("cy", d => d[0] ? d[0][1] : undefined)
        .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
        .attr("fill", (d, i) => seletedHTMLCollection && !isTrkSelected(idxToErrTrkIDArr[i]) ? "none" : ERR_TRK_COLOR);
    circles.exit()
        .attr("r", undefined);
    circles.enter()
        .append("circle")
        .attr("class", (d, i) => `Track ID: ${idxToErrTrkIDArr[i]}`)
        .attr("cx", d => d[0] ? d[0][0] : undefined)
        .attr("cy", d => d[0] ? d[0][1] : undefined)
        .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
        .attr("opacity", DEFAULT_OPACITY)
        .attr("fill", (d, i) => seletedHTMLCollection && !isTrkSelected(idxToErrTrkIDArr[i]) ? "none" : ERR_TRK_COLOR)
        .on("mouseover", highlight)
        .on("mouseout", unhighlight)
        .on("click", selectTrack);
    const paths = errTrkGroup.selectAll("path")
        .data(pathData)
        .attr("d", d => d3.line()(d))
        .attr("stroke", (d, i) => seletedHTMLCollection && !isTrkSelected(idxToErrTrkIDArr[i]) ? undefined : ERR_TRK_COLOR);
    paths.exit()
        .attr("d", undefined);
    paths.enter()
        .append("path")
        .attr("class", (d, i) => `Track ID: ${idxToErrTrkIDArr[i]}`)
        .attr("d", d => d3.line()(d))
        .attr("fill", "none")
        .attr("stroke", (d, i) => seletedHTMLCollection && !isTrkSelected(idxToErrTrkIDArr[i]) ? undefined : ERR_TRK_COLOR)
        .attr("opacity", DEFAULT_OPACITY)
        .attr("stroke-width", TRK_WIDTH)
        .on("mouseover", highlight)
        .on("mouseout", unhighlight)
        .on("click", selectTrack);

    if (seletedHTMLCollection) {
        const tempID = +seletedHTMLCollection[0].attributes.class.value.slice(OFFSET_TIL_TRK_ID_PATH_CLASSNAME);
        const tempTrk = trkDataSortedByTrkID.find(d => d[0].trkID === tempID).filter(d => d.imgIdx <= imgIdx)
        const tempPathData = [[], []];
        for (const point of tempTrk) {
            point.imgIdx <= trkIDToErrImgIdxMap.get(tempID)[0] ? tempPathData[0].push([point.x, point.y])
                : tempPathData[1].push([point.x, point.y])
        }
        tempPathData[1].unshift(trkIDToErrPathMap.get(tempID)[0]);
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