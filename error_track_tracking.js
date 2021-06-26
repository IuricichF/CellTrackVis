////////////////// Selection ////////////////////
const seletedHTMLCollectionArr = [];
const SELECTED_OPACITY = 1;
function highlight() {
    const htmlCollection = document.getElementsByClassName(`${this.getAttribute("class")}`);
    if (!seletedHTMLCollectionArr.includes(htmlCollection)) {
        for (const item of htmlCollection) {
            item.attributes.opacity.value = SELECTED_OPACITY;
        }
    }
}
function unhighlight() {
    const htmlCollection = document.getElementsByClassName(`${this.getAttribute("class")}`);
    if (!seletedHTMLCollectionArr.includes(htmlCollection)) {
        for (const item of htmlCollection) {
            item.attributes.opacity.value = DEFAULT_OPACITY;
        }
    }
}
function selectTrack() {
    const tempID = +this.getAttribute("class").slice(OFFSET_TIL_TRK_ID_PATH_CLASSNAME);
    const htmlCollection = document.getElementsByClassName(`${this.getAttribute("class")}`);
    let tempIdx = seletedHTMLCollectionArr.indexOf(htmlCollection);
    if (tempIdx === -1) {
        for (const item of htmlCollection) {
            item.attributes.opacity.value = SELECTED_OPACITY;
        }
        seletedHTMLCollectionArr.push(htmlCollection);
        addToSelectedTrackDisplayBox(tempID);
    } else {
        for (const item of htmlCollection) {
            item.attributes.opacity.value = DEFAULT_OPACITY;
        }
        seletedHTMLCollectionArr.splice(tempIdx, 1); 
        d3.select(`#highlightGroup${tempID}`).remove();
        removeFromSelectedTrackDisplayBox(tempID)
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
const imgSVG = d3.select("#imageSVG")
    .attr("width", sVGSideLength)
    .attr("height", sVGSideLength)
    .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`);
// image
const img = imgSVG.append("image")
    .attr("id", "image")
    // hardcoding the image file name for now, might change in future
    .attr("href", `/src/dataset_${datasetIdx}/${imgIdx}.png`)
    .attr("width", resolutionSideLength)
    .attr("height", resolutionSideLength);
// error track 
const errTrkGroup = imgSVG.append("g")
    .attr("class", "errorTrack");
// update the image
function updateImage(newIdx) {
    imgIdx = newIdx;
    // hardcoding the image file name for now, might change in future
    img.attr("href", `/src/dataset_${datasetIdx}/${imgIdx}.png`);
    imgSliderLabel.text(`Image Index: ${imgIdx}`);
    drawErrorTrack();
}
const DEFAULT_OPACITY = 0.6;
const OFFSET_TIL_TRK_ID_PATH_CLASSNAME = 10;
const ERR_TRK_COLOR = "red";
const CORRECT_TRK_COLOR_BEFORE_ERR = "green";
const CORRECT_TRK_COLOR_AFTER_ERR = "#6ef562";
const TRK_WIDTH = 10;
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
        .attr("fill", (d, i) => isNonselectedTrkHidden && !isTrkSelected(idxToTrkIDArr[i]) ? "none" : ERR_TRK_COLOR);
    circles.exit()
        .attr("r", undefined);
    circles.enter()
        .append("circle")
        .attr("class", (d, i) => `Track ID: ${idxToTrkIDArr[i]}`)
        .attr("cx", d => d[0] ? d[0][0] : undefined)
        .attr("cy", d => d[0] ? d[0][1] : undefined)
        .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
        .attr("opacity", DEFAULT_OPACITY)
        .attr("fill", (d, i) => isNonselectedTrkHidden && !isTrkSelected(idxToTrkIDArr[i]) ? "none" : ERR_TRK_COLOR)
        .on("mouseover", highlight)
        .on("mouseout", unhighlight)
        .on("click", selectTrack);
    const paths = errTrkGroup.selectAll("path")
        .data(pathData)
        .attr("d", d => d3.line()(d))
        .attr("stroke", (d, i) => isNonselectedTrkHidden && !isTrkSelected(idxToTrkIDArr[i]) ? undefined : ERR_TRK_COLOR);
    paths.exit()
        .attr("d", undefined);
    paths.enter()
        .append("path")
        .attr("class", (d, i) => `Track ID: ${idxToTrkIDArr[i]}`)
        .attr("d", d => d3.line()(d))
        .attr("fill", "none")
        .attr("stroke", (d, i) => isNonselectedTrkHidden && !isTrkSelected(idxToTrkIDArr[i]) ? undefined : ERR_TRK_COLOR)
        .attr("opacity", DEFAULT_OPACITY)
        .attr("stroke-width", TRK_WIDTH)
        .on("mouseover", highlight)
        .on("mouseout", unhighlight)
        .on("click", selectTrack);

    for (const collection of seletedHTMLCollectionArr) {
        const tempID = +collection[0].attributes.class.value.slice(OFFSET_TIL_TRK_ID_PATH_CLASSNAME);
        let tempGroup = d3.select(`#highlightGroup${tempID}`);
        if (tempGroup.size() === 0) tempGroup = errTrkGroup.append("g").attr("id", `highlightGroup${tempID}`);
        const tempTrk = trkDataSortedByTrkID.find(d => d[0].trkID === tempID).filter(d => d.imgIdx <= imgIdx)
        const tempPathData = [[], []];
        for (const point of tempTrk) {
            point.imgIdx <= trkIDToErrImgIdxMap.get(tempID)[0] ? tempPathData[0].push([point.x, point.y])
                : tempPathData[1].push([point.x, point.y])
        }
        tempPathData[1].unshift(trkIDToErrPathMap.get(tempID)[0]);
        const tempPath = tempGroup.selectAll("path")
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