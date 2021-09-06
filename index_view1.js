const view1ErrTrkGroupArr = [];
const resolutionSideLength = 2040;
const sVGSideLength = 300;
const createView1SVG = () => {
    const view1 = d3.select("#view1");
    datasetArr.forEach((d, i) => {
        const div = view1.append("div");
        div.attr("class", "box-content bg-gray-200 rounded-lg p-2")

        const fieldOfView = div.append("div");
        fieldOfView.attr("class", "flex justify-center")

        view1ErrTrkGroupArr[i] = fieldOfView.append("a")
            .attr("href", "view2.html")
            .attr("target", "_blank")
            .append("svg")
            .attr("id", `sVG${d.datasetIdx}`)
            .attr("width", sVGSideLength)
            .attr("height", sVGSideLength)
            .attr("style", "background-color:white")
            .attr("class", "shadow")
            .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`)
            .on("click", transferDataToView2)
            .append("g")
            .attr("id", `errorTrack${d.datasetIdx}`)

        const card = div.append("div")
        card.attr("class", "box-content p-2 self-center")

        const ul = card.append("ul")
        ul.attr("class", "list-dic")

        let numlinkErr = 0;
        for (const value of d.trkIDToErrTrkIDPredMap.values()) numlinkErr += value.length - 1;
        let numlink = d.trkData.length - d.idxToTrkIDArr.length;
        ul.append("li").text(`Field of view - #${d.datasetIdx}`)
        ul.append("li").text(`Linking errors - ${numlinkErr}`)
        ul.append("li").text(`Linking errors (%) - ${(numlinkErr / numlink * 100).toFixed(2)}%`)
        ul.append("li").text(`Total links - ${numlink}`)
        ul.append("li").text(`Cell count (0-${d.numImg - 1}) - ${d.cellCountAcrossIdx[0]}-${d.cellCountAcrossIdx[d.cellCountAcrossIdx.length - 1]}`)

        const graphHeight = 100;
        const graphWidth = 200;
        const cellCountGraph = ul.append("svg")
            .attr("width", graphWidth * (1 + 1 / 1.8))
            .attr("height", graphHeight * (1 + 1 / 3.4))
        const xScale = d3.scaleLinear()
            .domain([0, d.numImg - 1])
            .range([0, graphWidth])
        const yScale = d3.scaleLinear()
            .domain([Math.min(...d.cellCountAcrossIdx), Math.max(...d.cellCountAcrossIdx)])
            .range([graphHeight, 0])
        const data = [];
        d.cellCountAcrossIdx.forEach((d, i) => data.push({
            idx : i,
            count : d
        }))
        const line = d3.line()
            .x(d => xScale(d.idx))
            .y(d => yScale(d.count))
        cellCountGraph.append("path")
            .attr("d", line(data))
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
        const focus = cellCountGraph.append("g")
            .attr("style", "z-index: 999")
            .attr("class", "focus")
            .style("display", "none");
        focus.append("circle")
            .attr("r", 2);
        focus.append("rect")
            .attr("class", "tooltip")
            .attr("width", graphWidth / 1.8)
            .attr("height", graphHeight / 3.4)
            .attr("x", 10)
            .attr("fill", "white")
        focus.append("text")
            .attr("x", 10)
            .attr("y", graphHeight / 6.8)
            .text("Index:");
        focus.append("text")
            .attr("x", 10)
            .attr("y", graphHeight / 3.4)
            .text("Cell count:");
        focus.append("text")
            .attr("class", "tooltip-index")
            .attr("x", graphWidth / 1.8 * 0.79)
            .attr("y", graphHeight / 6.8)
        focus.append("text")
            .attr("class", "tooltip-count")
            .attr("x", graphWidth / 1.8 * 0.79)
            .attr("y", graphHeight / 3.4)
        cellCountGraph.append("rect")
            .attr("class", `overlay-${d.datasetIdx}`)
            .attr("width", graphWidth)
            .attr("height", graphHeight * (1 + 1 / 3.4))
            .attr("opacity", 0)
            .on("mouseover", () => focus.style("display", null))
            .on("mouseout", () => focus.style("display", "none"))
            .on("mousemove", showDetailWhenMousemove);

        function showDetailWhenMousemove() {
            var x = xScale.invert(d3.pointer(event, this)[0]);
            x = (x % 1 > 0.5) ? Math.trunc(x) + 1 : Math.trunc(x)
            focus.attr("transform", `translate(${xScale(x)}, ${yScale(d.cellCountAcrossIdx[x])})`);
            focus.select(".tooltip-index").text(`${x}`);
            focus.select(".tooltip-count").text(`${d.cellCountAcrossIdx[x]}`);
        }
    })
}
var numErr;
const ERR_TRK_COLOR = "red";
const TRK_WIDTH = 10;
const drawErrorLink = () => {
    datasetArr.forEach((currDataset, datasetArrIdx) => {
        const pathData = [];
        for (const value of currDataset.trkIDToErrPathMap.values()) {
            for (const point of value) {
                pathData.push(point);
            }
        }
        if (pathData.length === 0) {
            const text = view1ErrTrkGroupArr[datasetArrIdx].append("text")
                .attr("id", `noErrorText${currDataset.datasetIdx}`)
                .attr("y", resolutionSideLength / 2)
                .attr("style", "font: 50px sans-serif")
                .text("Congratulation, this dataset has no error!");
            const tempWidth = document.getElementById(`noErrorText${currDataset.datasetIdx}`).getBBox().width
            text.attr("x", (resolutionSideLength - tempWidth) / 2)
        }
        else {
            view1ErrTrkGroupArr[datasetArrIdx].selectAll("circle")
                .data(pathData)
                .enter()
                .append("circle")
                .attr("class", (d, i) => `Track ID: ${currDataset.idxToTrkIDArr[i]}`)
                .attr("cx", d => d[0] ? d[0][0] : undefined)
                .attr("cy", d => d[0] ? d[0][1] : undefined)
                .attr("r", d => d[0] ? TRK_WIDTH * 1.5 : undefined)
                .attr("fill", ERR_TRK_COLOR)

            view1ErrTrkGroupArr[datasetArrIdx].selectAll("path")
                .data(pathData)
                .enter()
                .append("path")
                .attr("class", (d, i) => `Track ID: ${currDataset.idxToTrkIDArr[i]}`)
                .attr("d", d => d3.line()(d))
                .attr("fill", "none")
                .attr("stroke", ERR_TRK_COLOR)
                .attr("stroke-width", TRK_WIDTH)
        }
    })
}
function transferDataToView2() {
    const offset = 3;
    const data = datasetArr.find(d => d.datasetIdx === +this.getAttribute("id").slice(offset));
    localStorage.setItem("datasetIdx", data.datasetIdx);
    localStorage.setItem("numImg", data.numImg);
    localStorage.setItem("numTree", data.idxToTreeIDArr.length);
    localStorage.setItem("trkIDToErrPathMap", JSON.stringify(Array.from(data.trkIDToErrPathMap.entries())));
    localStorage.setItem("trkIDToErrImgIdxMap", JSON.stringify(Array.from(data.trkIDToErrImgIdxMap.entries())));
    var tempTreeIDArr = [];
    for (const key of data.trkIDToErrImgIdxMap.keys()) {
        let tempTreeID = data.trkData.find(d => d.trkID === key).treeID;
        if (!tempTreeIDArr.includes(tempTreeID)) tempTreeIDArr.push(tempTreeID);
    }
    const tempIdxToTrkIDArr = data.idxToTrkIDArr.filter((d => tempTreeIDArr.includes(data.trkData.find(d2 => d2.trkID === d).treeID)));
    const idxToErrTrkIDArr = data.idxToTrkIDArr.filter(d => data.trkIDToErrImgIdxMap.has(d));
    tempTreeIDArr = tempTreeIDArr.filter(d => d !== undefined);
    localStorage.setItem("idxToTreeIDWithErrArr", JSON.stringify(tempTreeIDArr));
    localStorage.setItem("idxToTreeIDNoErrArr", JSON.stringify(data.idxToTreeIDArr.filter(d => !tempTreeIDArr.includes(d))));
    localStorage.setItem("idxToErrTrkIDArr", JSON.stringify(idxToErrTrkIDArr));
    localStorage.setItem("idxToTrkIDWithErrArr", JSON.stringify(tempIdxToTrkIDArr));
    localStorage.setItem("idxToTrkIDNoErrArr", JSON.stringify(data.idxToTrkIDArr.filter(d => !tempIdxToTrkIDArr.includes(d))));
    localStorage.setItem("trkDataSortedByTrkID", JSON.stringify(data.trkDataSortedByTrkID));

}
