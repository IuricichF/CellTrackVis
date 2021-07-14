// const numDatasetInputElement = document.getElementById("numberOfDatasetInput");
// const removeDatasetNumInput = () => d3.select("#numberOfDatasetDiv").remove();




const view1ErrTrkGroupArr = [];
const resolutionSideLength = 2040;
const sVGSideLength = 350;

/*const round2Decimal = (num) => Math.round(num * 100) / 100;*/
const createView1SVG = () => {

    const view1 = d3.select("#view1");
    datasetArr.forEach((d, i) => {
        const div = view1.append("div");
        div.attr("class", "box-content bg-white rounded-lg p-2")

        const fieldOfView = div.append("div");
        fieldOfView.attr("class", "flex justify-center")


        view1ErrTrkGroupArr[i] = fieldOfView.append("a")
            .attr("href", "view2.html")
            .attr("target", "_blank")
            .append("svg")
            .attr("id", `sVG${d.datasetIdx}`)
            .attr("width", sVGSideLength)
            .attr("height", sVGSideLength)
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
        ul.append("li").text(`Linking errors (%) - ${numlinkErr / numlink * 100}%`)
        ul.append("li").text(`Max cells - ${d.idxToTrkIDArr.length}`)
        ul.append("li").text(`Total links - ${numlink}`)


    })
}

var numErr;
const ERR_TRK_COLOR = "red";
const TRK_WIDTH = 10;
const drawErrorTrack = () => {
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
    localStorage.setItem("trkIDToErrTrkIDPredMap", JSON.stringify(Array.from(data.trkIDToErrTrkIDPredMap.entries())));
    localStorage.setItem("trkIDToErrPathMap", JSON.stringify(Array.from(data.trkIDToErrPathMap.entries())));
    localStorage.setItem("trkIDToErrImgIdxMap", JSON.stringify(Array.from(data.trkIDToErrImgIdxMap.entries())));
    const tempTreeIDArr = [];
    for (const key of data.trkIDToErrImgIdxMap.keys()) {
        let tempTreeID = data.trkData.find(d => d.trkID === key).treeID;
        if (!tempTreeIDArr.includes(tempTreeID)) tempTreeIDArr.push(tempTreeID);
    }
    const tempIdxToTrkIDArr = data.idxToTrkIDArr.filter((d => tempTreeIDArr.includes(data.trkData.find(d2 => d2.trkID === d).treeID)));
    const idxToErrTrkIDArr = data.idxToTrkIDArr.filter(d => data.trkIDToErrImgIdxMap.has(d));
    localStorage.setItem("idxToErrTrkIDArr", JSON.stringify(idxToErrTrkIDArr));
    localStorage.setItem("idxToTrkIDArr", JSON.stringify(tempIdxToTrkIDArr));
    localStorage.setItem("idxToTreeIDArr", JSON.stringify(tempTreeIDArr.filter(d => d !== undefined)));
    localStorage.setItem("trkDataSortedByTrkID", JSON.stringify(data.trkDataSortedByTrkID.filter(d => tempIdxToTrkIDArr.includes(d[0].trkID))));
}