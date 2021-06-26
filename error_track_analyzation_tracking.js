////////////////// Selection ////////////////////
const OFFSET_TIL_TRK_ID_PRED_CLASSNAME = 15;
const selectedTrkIDPredArr = []
function selectTrackPred() {
    const tempID = +this.getAttribute("class").slice(OFFSET_TIL_TRK_ID_PRED_CLASSNAME);
    const tempIdx = selectedTrkIDPredArr.indexOf(tempID);
    if (tempIdx === -1) {
        selectedTrkIDPredArr.push(tempID)
    } else {
        selectedTrkIDPredArr.splice(tempIdx, 1);
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
    .attr("href", `/DataVis/src/dataset_${datasetIdx}/${imgIdx}.png`)
    .attr("width", resolutionSideLength)
    .attr("height", resolutionSideLength);
// error track 
const trueTrkGroup = imgSVG.append("g")
    .attr("class", "trueTrack");
function updateImage(newIdx) {
    imgIdx = newIdx;
    // hardcoding the image file name for now, might change in future
    img.attr("href", `/DataVis/src/dataset_${datasetIdx}/${imgIdx}.png`);
    imgSliderLabel.text(`Image Index: ${imgIdx}`);
    drawErrorTrack();
}
const IN_BTW_PRED_TRK_COLOR = "black"
const TRK_WIDTH = 10;
const errTrkGroup = imgSVG.append("g")
    .attr("class", "errTrack");
///////// rainbow
const RAINBOW_COLOR_ARR = ["red", "orange", "yellow", "green", "blue", "indigo", "purple"];
const trkIDPredToColorMap = new Map();
for (let i = 0, j = 0; i < idxToTrkIDPredArr.length; i++) {
    if (!trkIDPredToColorMap.has(idxToTrkIDPredArr[i])) {
        trkIDPredToColorMap.set(idxToTrkIDPredArr[i], RAINBOW_COLOR_ARR[j++]);
    }
}
function drawErrorTrack() {
    const tempTrkData = trkData.filter(d => d.imgIdx <= imgIdx);
    if (tempTrkData.length > 0) {
        const pathDataArr = [];
        let tempTrkID = tempTrkData[0].trkIDPred;
        for (let i = 0, j = 0; i < tempTrkData.length; i++) {
            if (tempTrkID !== tempTrkData[i].trkIDPred) {
                tempTrkID = tempTrkData[i].trkIDPred
                j++;
            }
            if (pathDataArr[j] === undefined) pathDataArr[j] = [];
            pathDataArr[j].push([tempTrkData[i].x, tempTrkData[i].y]);
        }
        const tempLength = pathDataArr.length - 1;
        for (let i = 0, j = 1; i < tempLength; i++) {
            pathDataArr.splice(j, 0, [pathDataArr[j - 1][pathDataArr[j - 1].length - 1], pathDataArr[j][0]]);
            j += 2;
        }
        const paths = trueTrkGroup.selectAll("path")
            .data(pathDataArr)
            .attr("d", d => d3.line()(d));
        paths.exit()
            .attr("d", undefined);
        paths.enter()
            .append("path")
            .attr("class", (d, i) => i % 2 === 0 ? `Track ID Pred: ${idxToTrkIDPredArr[i / 2]}` : null)
            .attr("d", d => d3.line()(d))
            .attr("fill", "none")
            .attr("stroke", (d, i) => i % 2 === 0 ? trkIDPredToColorMap.get(idxToTrkIDPredArr[i / 2]) : IN_BTW_PRED_TRK_COLOR)
            .attr("stroke-width", TRK_WIDTH)
            .on("click", selectTrackPred);


        for (const trk of selectedTrkIDPredArr) {
            let tempGroup = d3.select(`#highlightGroup${trk}`);
            if (tempGroup.size() === 0) tempGroup = errTrkGroup.append("g").attr("id", `highlightGroup${trk}`);
            const tempTrk = trkPredData.find(d => d[0].trkIDPred === trk).filter(d => d.imgIdx <= imgIdx)
            const tempPathData = [[]];
            for (const point of tempTrk) {
                tempPathData[0].push([point.x, point.y])
            }
            const tempPath = tempGroup.selectAll("path")
                .data(tempPathData)
                .attr("d", d => d3.line()(d))
            tempPath.exit()
                .attr("d", undefined)
            tempPath.enter()
                .append("path")
                .attr("d", d => d3.line()(d))
                .attr("fill", "none")
                .attr("stroke", trkIDPredToColorMap.get(trk))
                .attr("stroke-width", TRK_WIDTH)
        }
    }
}
