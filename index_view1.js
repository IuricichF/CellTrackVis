const view1 = d3.select("#view1");
const view1ErrTrkGroupArr = [];
const resolutionSideLength = 2040;
const sVGSideLength = 350;
const createView1SVG = () => {
    for (let i = 0; i < numDataset; i++) {
        view1ErrTrkGroupArr[i] = view1.append("div").append("svg")
            .attr("width", sVGSideLength)
            .attr("height", sVGSideLength)
            .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`)
            .append("g")
            .attr("id", `errorTrack${i}`);
    }
}
const ERR_TRK_COLOR = "red";
const TRK_WIDTH = 10;
const drawErrorTrack = (datasetIdx) => {
    const pathData = [];
    for (const value of datasetArr[datasetIdx].trkIDToErrPathMap.values()) {
        pathData.push(value);
    }
    console.log()
    const circles = view1ErrTrkGroupArr[datasetIdx].selectAll("circle")
        .data(pathData)
        .attr("cx", d => d[0] ? d[0][0] : undefined)
        .attr("cy", d => d[0] ? d[0][1] : undefined)
        .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
    circles.exit()
        .attr("r", undefined);
    circles.enter()
        .append("circle")
        .attr("class", (d, i) => `Track ID: ${datasetArr[datasetIdx].idxToTrkIDArr[i]}`)
        .attr("cx", d => d[0] ? d[0][0] : undefined)
        .attr("cy", d => d[0] ? d[0][1] : undefined)
        .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
        .attr("fill", ERR_TRK_COLOR)

    const paths = view1ErrTrkGroupArr[datasetIdx].selectAll("path")
        .data(pathData)
        .attr("d", d => d3.line()(d))
    paths.exit()
        .attr("d", undefined);
    paths.enter()
        .append("path")
        .attr("class", (d, i) => `Track ID: ${datasetArr[datasetIdx].idxToTrkIDArr[i]}`)
        .attr("d", d => d3.line()(d))
        .attr("fill", "none")
        .attr("stroke", ERR_TRK_COLOR)
        .attr("stroke-width", TRK_WIDTH)
}
