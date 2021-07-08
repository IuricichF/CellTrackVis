const numDatasetInputElement = document.getElementById("numberOfDatasetInput");
const removeDatasetNumInput = () => d3.select("#numberOfDatasetDiv").remove();
const view1 = d3.select("#view1");
const view1ErrTrkGroupArr = [];
const resolutionSideLength = 2040;
const sVGSideLength = 350;
const createView1SVG = () => {
    datasetArr.forEach((d, i) => {
        const div = view1.append("div");
        div.append("h1").text(`dataset #${d.datasetIdx}`)
        view1ErrTrkGroupArr[i] = div.append("a")
            .attr("href", "view2.html")
            .attr("target", "_blank")
            .append("svg")
            .attr("width", sVGSideLength)
            .attr("height", sVGSideLength)
            .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`)
            .on("click", transferDataForView2)
            .append("g")
            .attr("id", `errorTrack${d.datasetIdx}`);
    })
}
const ERR_TRK_COLOR = "red";
const TRK_WIDTH = 10;
const drawErrorTrack = () => {
    datasetArr.forEach((currDataset, datasetArrIdx) => {
        const pathData = [];
        for (const value of currDataset.trkIDToErrPathMap.values()) {
            pathData.push(value);
        }
        if (pathData.length === 0) {
            const text = view1ErrTrkGroupArr[datasetArrIdx].append("text")
                .attr("id", `noErrorText${currDataset.datasetIdx}`)
                .attr("y", resolutionSideLength / 2)
                .attr("style", "font: 50px sans-serif")
                .text("Congratulation, this dataset has no error!");
            const tempWidth = document.getElementById(`noErrorText${currDataset.datasetIdx}`).getBBox().width;
            text.attr("x", (resolutionSideLength - tempWidth) / 2)
        }
        else {
            const circles = view1ErrTrkGroupArr[datasetArrIdx].selectAll("circle")
                .data(pathData)
                .attr("cx", d => d[0] ? d[0][0] : undefined)
                .attr("cy", d => d[0] ? d[0][1] : undefined)
                .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
            circles.exit()
                .attr("r", undefined);
            circles.enter()
                .append("circle")
                .attr("class", (d, i) => `Track ID: ${currDataset.idxToTrkIDArr[i]}`)
                .attr("cx", d => d[0] ? d[0][0] : undefined)
                .attr("cy", d => d[0] ? d[0][1] : undefined)
                .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
                .attr("fill", ERR_TRK_COLOR)

            const paths = view1ErrTrkGroupArr[datasetArrIdx].selectAll("path")
                .data(pathData)
                .attr("d", d => d3.line()(d))
            paths.exit()
                .attr("d", undefined);
            paths.enter()
                .append("path")
                .attr("class", (d, i) => `Track ID: ${currDataset.idxToTrkIDArr[i]}`)
                .attr("d", d => d3.line()(d))
                .attr("fill", "none")
                .attr("stroke", ERR_TRK_COLOR)
                .attr("stroke-width", TRK_WIDTH)
        }
    })
}
const transferDataForView2 = () => {
    console.log("caonima")
}