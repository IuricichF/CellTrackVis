const sVGSideLength = 600;
const trkWidth = 20;
const errTrkColorArr = ["red", "blue", "black"];
const resolutionSideLength = +localStorage.getItem("resolutionSideLength");
const datasetIdx = +localStorage.getItem("datasetIdx");
const dt = +localStorage.getItem("dt");
const processRawData = eval('(' + localStorage.getItem("processRawData") + ')');
const algArr = JSON.parse(localStorage.getItem("algArr"));
const initView2 = function() {
    let data = [];
    for (let i = 0; i < algArr.length; i++) {
        d3.csv(`/DataVis/src/dataset_${datasetIdx}/res_${algArr[i]}_real_dt${dt}.csv`).then(rawData => {
            data.push(processRawData(datasetIdx, dt, rawData));
            const compareDiv = d3.select("#compareDiv");
            if (data.length === algArr.length) {
                data.forEach((d, i) => {
                    const errLinkWindow = compareDiv
                    .append("div")
                    .attr("id",`div-${algArr[i]}`)
                    .attr("class", "box-content rounded-lg p-2 flex justify-center")
                    .append("a")
                    .attr("href", "view3.html")
                    .attr("target", "_blank")
                    .append("svg")
                    .attr("id",`svg-${algArr[i]}`)
                    .attr("width", sVGSideLength)
                    .attr("height", sVGSideLength)
                    .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`)
                    .attr("style", "background-color:white")
                    .on("click", transferDataToView3)
                    .append("g")
                    .attr("id", `errorLink-${algArr[i]}`);
                    
                    function transferDataToView3() {
                        const index = algArr.indexOf(this.getAttribute("id").split('-')[1]);
                        localStorage.setItem("datasetIdx", data[index].datasetIdx);
                        localStorage.setItem("numImg", data[index].numImg);
                        localStorage.setItem("numTree", data[index].idxToTreeIDArr.length);
                        localStorage.setItem("resolutionSideLength", resolutionSideLength);
                        localStorage.setItem("trkIDToErrPathMap", JSON.stringify(Array.from(data[index].trkIDToErrPathMap.entries())));
                        localStorage.setItem("trkIDToErrImgIdxMap", JSON.stringify(Array.from(data[index].trkIDToErrImgIdxMap.entries())));
                        var tempTreeIDArr = [];
                        for (const key of data[index].trkIDToErrImgIdxMap.keys()) {
                            let tempTreeID = data[index].trkData.find(d => d.trkID === key).treeID;
                            if (!tempTreeIDArr.includes(tempTreeID)) tempTreeIDArr.push(tempTreeID);
                        }
                        const tempIdxToTrkIDArr = data[index].idxToTrkIDArr.filter((d => tempTreeIDArr.includes(data[index].trkData.find(d2 => d2.trkID === d).treeID)));
                        const idxToErrTrkIDArr = data[index].idxToTrkIDArr.filter(d => data[index].trkIDToErrImgIdxMap.has(d));
                        tempTreeIDArr = tempTreeIDArr.filter(d => d !== undefined);
                        localStorage.setItem("idxToTreeIDWithErrArr", JSON.stringify(tempTreeIDArr));
                        localStorage.setItem("idxToTreeIDNoErrArr", JSON.stringify(data[index].idxToTreeIDArr.filter(d => !tempTreeIDArr.includes(d))));
                        localStorage.setItem("idxToErrTrkIDArr", JSON.stringify(idxToErrTrkIDArr));
                        localStorage.setItem("idxToTrkIDWithErrArr", JSON.stringify(tempIdxToTrkIDArr));
                        localStorage.setItem("idxToTrkIDNoErrArr", JSON.stringify(data[index].idxToTrkIDArr.filter(d => !tempIdxToTrkIDArr.includes(d))));
                        localStorage.setItem("trkDataSortedByTrkID", JSON.stringify(data[index].trkDataSortedByTrkID));
                    }

                    const errLinkPathData = [];
                    for (const key of d.trkIDToErrImgIdxMap.keys()) {
                        const points = d.trkIDToErrPathMap.get(key)
                        const idxs = d.trkIDToErrImgIdxMap.get(key)
                        for (let i = 0; i < idxs.length; i++) {
                            const temp = []
                            for (let j = 0; j < idxs[i].length; j++) {
                                temp.push(points[i][j].concat(idxs[i][j]))
                            }
                            errLinkPathData.push(temp);
                        }
                    }

                    if (errLinkPathData.length === 0) {
                        const text = errLinkWindow.append("text")
                            .attr("id", `noErrorText${d.datasetIdx}`)
                            .attr("y", resolutionSideLength / 2)
                            .attr("style", "font: 50px sans-serif")
                            .text("Congratulation, this dataset has no error!");
                        const tempWidth = document.getElementById(`noErrorText${d.datasetIdx}`).getBBox().width
                        text.attr("x", (resolutionSideLength - tempWidth) / 2)
                    }
                    else {
                        errLinkWindow.selectAll("circle")
                            .data(errLinkPathData)
                            .enter()
                            .append("circle")
                            .attr("class", d => `${algArr[i]}-${d[0][2]}`)
                            .attr("cx", d => d[0][0])
                            .attr("cy", d => d[0][1])
                            .attr("r", trkWidth * 1.5)
                            .attr("fill", errTrkColorArr[i]);
        
                        errLinkWindow.selectAll("path")
                            .data(errLinkPathData)
                            .enter()
                            .append("path")
                            .attr("class", d => `${algArr[i]}-${d[0][2]}`)
                            .attr("d", d => d3.line()(d))
                            .attr("fill", "none")
                            .attr("stroke", errTrkColorArr[i])
                            .attr("stroke-width", trkWidth);
                    }
                })
                // color shared error links from two algorithms
                d3.select(`#svg-${algArr[0]}`).selectAll("circle").each(function(){
                    const circle = this;
                    const idx = circle.getAttribute("class").split('-')[1];
                    const x = circle.getAttribute('cx')
                    const y = circle.getAttribute('cy')
                    d3.select(`#svg-${algArr[1]}`).selectAll(`circle.${algArr[1]}-${idx}`).each(function(){
                        if (x === this.getAttribute('cx') && y === this.getAttribute('cy')) {
                            circle.setAttribute("fill", errTrkColorArr[2]);
                            this.setAttribute("fill", errTrkColorArr[2]);
                        }
                    })
                })   
                d3.select(`#svg-${algArr[0]}`).selectAll("path").each(function(){
                    const path = this;
                    const idx = path.getAttribute("class").split('-')[1];
                    const d = path.getAttribute('d')
                    d3.select(`#svg-${algArr[1]}`).selectAll(`path.${algArr[1]}-${idx}`).each(function(){
                        if (d === this.getAttribute('d')) {
                            path.setAttribute("stroke", errTrkColorArr[2]);
                            this.setAttribute("stroke", errTrkColorArr[2]);
                        }
                    })
                })
                // comparison panel
                const compaList = compareDiv.append("div")
                    .attr("id", "comparisonPanel")
                    .attr("class", "flex justify-center")
                    .append("ul")
                    .attr("id", "comparisonList")
                    .attr("class", "box-content p-2 self-center");
                compaList.append("li").text(`Field of View - #${datasetIdx}`);
                let errLinkNum1 = 0;
                let LinkNum1 = data[0].trkData.length - data[0].idxToTrkIDArr.length;
                for (const value of data[0].trkIDToErrTrkIDPredMap.values()) errLinkNum1 += value.length - 1;
                let errLinkNum2 = 0;
                let LinkNum2 = data[1].trkData.length - data[1].idxToTrkIDArr.length;
                for (const value of data[1].trkIDToErrTrkIDPredMap.values()) errLinkNum2 += value.length - 1;
                let item = compaList.append("li").text("Linking errors - ");
                item.append("span")
                    .style("color", `${errTrkColorArr[0]}`)
                    .text(`${errLinkNum1}`);
                item.append("text").text(", ")
                item.append("span")
                    .style("color", `${errTrkColorArr[1]}`)
                    .text(`${errLinkNum2}`);
                item = compaList.append("li").text("Linking errors (%) - ");
                item.append("span")
                    .style("color", `${errTrkColorArr[0]}`)
                    .text(`${(errLinkNum1 / LinkNum1 * 100).toFixed(2)}%`);
                item.append("text").text(", ")
                item.append("span")
                    .style("color", `${errTrkColorArr[1]}`)
                    .text(`${(errLinkNum2 / LinkNum2 * 100).toFixed(2)}%`);
                item = compaList.append("li").text("Total links - ");
                item.append("span")
                    .style("color", `${errTrkColorArr[0]}`)
                    .text(`${LinkNum1}`);
                item.append("text").text(", ")
                item.append("span")
                    .style("color", `${errTrkColorArr[1]}`)
                    .text(`${LinkNum2}`);
                item = compaList.append("li").text(`Total Cell count (0-${data[0].numImg - 1}) - `);
                item.append("span")
                    .style("color", `${errTrkColorArr[0]}`)
                    .text(`${data[0].cellCountAcrossIdx[0]}-${data[0].cellCountAcrossIdx[data[0].cellCountAcrossIdx.length - 1]}`);
                item.append("text").text(", ")
                item.append("span")
                    .style("color", `${errTrkColorArr[1]}`)
                    .text(`${data[1].cellCountAcrossIdx[0]}-${data[1].cellCountAcrossIdx[data[1].cellCountAcrossIdx.length - 1]}`);
                
                const graphHeight = 100;
                const graphWidth = 200;
                const tooltipHeight = graphHeight / 2;
                const tooltipWidth = graphWidth / 1.4;
                const cellCountGraph = compaList.append("li").append("svg")
                    .attr("width", graphWidth + tooltipWidth)
                    .attr("height", graphHeight)
                    .attr("viewBox", `0 0 ${graphWidth + tooltipWidth} ${graphHeight}`);
                const xScale = d3.scaleLinear()
                    .domain([0, data[0].numImg - 1])
                    .range([0, graphWidth])
                const yScale = d3.scaleLinear()
                    .domain([Math.min(...data[0].cellCountAcrossIdx, ...data[1].cellCountAcrossIdx)
                        , Math.max(...data[0].cellCountAcrossIdx, ...data[1].cellCountAcrossIdx)])
                    .range([graphHeight, 0])
                const pathData = [[], []];
                data.forEach((d, i) => {
                    d.cellCountAcrossIdx.forEach((dd, ii) => pathData[i].push({
                        idx : ii,
                        count : dd
                    }))
                })
                const line = d3.line()
                .x(d => xScale(d.idx))
                .y(d => yScale(d.count))
                cellCountGraph.selectAll("path")
                .data(pathData)
                .enter()
                .append("path")
                .attr('d', d => line(d))
                .attr("fill", "none")
                .attr("stroke", (d, i) => errTrkColorArr[i])
                .attr("stroke-width", 1)
                const tooltipGroup = cellCountGraph.append("g")
                    .attr("transform", `translate(${graphWidth}, ${(graphHeight - tooltipHeight) / 2})`)
                const tooltip = tooltipGroup.append("rect")
                    .attr("height", tooltipHeight)
                    .attr("width", tooltipWidth)
                    .attr("fill", "white");
                const idxText = tooltipGroup.append("text")
                    .text("Index: 0");
                const cellNumText = tooltipGroup.append("text")
                    .text(`Cell count: `);
                // cellNumText.append("span")
                //     .style("color", `${errTrkColorArr[0]}`)
                //     .text(`${data[0].cellCountAcrossIdx[0]}`);
                // cellNumText.append("text").text(", ");
                // cellNumText.append("span")
                //     .style("color", `${errTrkColorArr[1]}`)
                //     .text(`${data[1].cellCountAcrossIdx[0]}`);
                const textHeight = idxText.node().getBBox().height;
                idxText.attr('y', textHeight);
                cellNumText.attr('y', tooltipHeight - textHeight / 2);
                cellCountGraph.append("rect")
                .attr("width", graphWidth)
                .attr("height", graphHeight)
                .attr("opacity", 0)
                .on("mousemove", showDetailWhenMousemove);
                const tooltipIndicator = cellCountGraph.append("rect")
                    .attr("width", 1)
                    .attr("height", graphHeight)
                function showDetailWhenMousemove() {
                    let x = xScale.invert(d3.pointer(event, this)[0]);
                    x = (x % 1 > 0.5) ? Math.trunc(x) + 1 : Math.trunc(x)
                    tooltipIndicator.attr('x', xScale(x));
                    idxText.text(`Index: ${x}`);
                    cellNumText.text(`Cell count: ${data[0].cellCountAcrossIdx[x]}, ${data[1].cellCountAcrossIdx[x]}`);
                    tempWidth = Math.max(idxText.node().getBBox().width, cellNumText.node().getBBox().width);
                    if (tempWidth > tooltipWidth) tooltip.attr("width", tempWidth);
                }

                compareDiv.node().appendChild(compareDiv.node().childNodes[2]);

            }
        })
    }
    return { 
        data: data
    }
}()
