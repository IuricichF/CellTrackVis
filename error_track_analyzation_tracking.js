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
    .attr("href", `DataVis/src/dataset_${datasetIdx}/${imgIdx}.png`)
    .attr("width", resolutionSideLength)
    .attr("height", resolutionSideLength);
// error track 
const errTrkGroup = imgSVG.append("g")
    .attr("class", "errorTrack");
function updateImage(newIdx) {
    imgIdx = newIdx;
    // hardcoding the image file name for now, might change in future
    img.attr("href", `DataVis/src/dataset_${datasetIdx}/${imgIdx}.png`);
    imgSliderLabel.text(`Image Index: ${imgIdx}`);
    drawErrorTrack();
}
function drawErrorTrack() {
    const tempTrkData = trkData.filter(d => d.imgIdx <= imgIdx);
    if (tempTrkData.length > 0) {
        const pathDataArr = [];
        trkIDPredArr
            .forEach(() => pathDataArr.push([]));
        let tempTrkID = tempTrkData[0].trkIDPred;
        for (let i = 0, j = 0; i < tempTrkData.length; i++) {
            if (tempTrkID !== tempTrkData[i].trkIDPred) {
                tempTrkID = tempTrkData[i].trkIDPred
                j++;
            }
            pathDataArr[j].push([tempTrkData[i].x, tempTrkData[i].y]);
        }
        const paths = errTrkGroup.selectAll("path")
            .data(pathDataArr)
            .attr("d", d => d3.line()(d));
        paths.exit()
            .attr("d", undefined);
        paths.enter()
            .append("path")
            .attr("d", d => d3.line()(d))
            .attr("fill", "none")
            .attr("stroke", "#6ef562")
            .attr("stroke-width", 10)
    }
}
