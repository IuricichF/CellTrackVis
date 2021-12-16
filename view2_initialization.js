const sVGSideLength = 450;
const trkWidth = 20;
const sameTrkColor = "black";
const resolutionSideLength = +localStorage.getItem("resolutionSideLength");
const datasetIdx = +localStorage.getItem("datasetIdx");
const dt = +localStorage.getItem("dt");
const processRawData = eval('(' + localStorage.getItem("processRawData") + ')');
const algArr = JSON.parse(localStorage.getItem("algArr"));
const algColorArr = JSON.parse(localStorage.getItem("algColorArr"));
const initView2 = function() {
    let data = [];
    let dataReadCount = 0;
    for (let i = 0; i < algArr.length; i++) {
        d3.csv(`./src/dataset_${datasetIdx}/${algArr[i]}_dt${dt}.csv`).then(rawData => {
            data[i] = processRawData(datasetIdx, dt, rawData);
            dataReadCount++;
            if (dataReadCount === algArr.length) {
                const compareDiv = d3.select("#compareDiv");
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
                            .attr("fill", algColorArr[i]);
        
                        errLinkWindow.selectAll("path")
                            .data(errLinkPathData)
                            .enter()
                            .append("path")
                            .attr("class", d => `${algArr[i]}-${d[0][2]}`)
                            .attr("d", d => d3.line()(d))
                            .attr("fill", "none")
                            .attr("stroke", algColorArr[i])
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
                            circle.setAttribute("fill", sameTrkColor);
                            this.setAttribute("fill", sameTrkColor);
                        }
                    })
                })   
                d3.select(`#svg-${algArr[0]}`).selectAll("path").each(function(){
                    const path = this;
                    const idx = path.getAttribute("class").split('-')[1];
                    const d = path.getAttribute('d')
                    d3.select(`#svg-${algArr[1]}`).selectAll(`path.${algArr[1]}-${idx}`).each(function(){
                        if (d === this.getAttribute('d')) {
                            path.setAttribute("stroke", sameTrkColor);
                            this.setAttribute("stroke", sameTrkColor);
                        }
                    })
                })
                // comparison panel
                const compaList = compareDiv.append("div")
                    .attr("id", "comparisonPanel")
                    .attr("class", "flex justify-center text-center")
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
                
                let item = compaList.append("li").attr("class", "text-4xl");
                item.append("span")
                    .style("color", `${algColorArr[0]}`)
                    .text(`${algArr[0]}`);
                item.append("text").text(" vs. ")
                item.append("span")
                    .style("color", `${algColorArr[1]}`)
                    .text(`${algArr[1]}`);
                item = compaList.append("li").text(`Total links - ${LinkNum1}`);
                item = compaList.append("li").text("Linking errors - ");
                item.append("span")
                    .style("color", `${algColorArr[0]}`)
                    .text(`${errLinkNum1}`);
                item.append("text").text(", ")
                item.append("span")
                    .style("color", `${algColorArr[1]}`)
                    .text(`${errLinkNum2}`);
                item = compaList.append("li").text("Linking errors (%) - ");
                item.append("span")
                    .style("color", `${algColorArr[0]}`)
                    .text(`${(errLinkNum1 / LinkNum1 * 100).toFixed(2)}%`);
                item.append("text").text(", ")
                item.append("span")
                    .style("color", `${algColorArr[1]}`)
                    .text(`${(errLinkNum2 / LinkNum2 * 100).toFixed(2)}%`);
                                     
                const graphWidth = 250;
                const graphHeight = 150;
                const tooltipHeight = graphHeight * 0.2;
                const cellCountGraphGroup = compaList.append("li").append("g");
                cellCountGraphGroup.append("text").text("Cell Count vs. Image Index")
                const cellCountGraph = cellCountGraphGroup.append("svg")
                                    .attr("width", graphWidth)
                                    .attr("height", graphHeight)
                                    .attr("class", "bg-white m-auto")
                                    .on("mouseover", () => focus.style("display", null))
                                    .on("mouseout", () => focus.style("display","none"))
                                    .on("mousemove", showDetailWhenMousemove);
                const cellCountGraphRightPadding = graphWidth * 0.07;    
                const xScale = d3.scaleLinear()
                    .domain([0, data[0].numImg - 1]);
                const xAxis = cellCountGraph.append("g")
                    .call(d3.axisBottom(xScale));
                const cellCountGraphBotPadding = xAxis.node().getBoundingClientRect().height;
                xAxis.attr("transform", `translate(0, ${graphHeight - cellCountGraphBotPadding})`)
                const yScale = d3.scaleLinear().domain([Math.min(...data[0].cellCountAcrossIdx), Math.max(...data[0].cellCountAcrossIdx)]);
                const yAxis = cellCountGraph.append("g")
                    .call(d3.axisLeft(yScale));
                const cellCountGraphLeftPadding = yAxis.node().getBoundingClientRect().width;
                yAxis.attr("transform", `translate(${cellCountGraphLeftPadding}, 0)`)
                xScale.range([cellCountGraphLeftPadding, graphWidth - cellCountGraphRightPadding]);
                xAxis.call(d3.axisBottom(xScale).ticks(5));
                yScale.range([graphHeight - cellCountGraphBotPadding, tooltipHeight]);
                yAxis.call(d3.axisLeft(yScale));
                                            
                const linearPath = [];
                data[0].cellCountAcrossIdx.forEach((d, i) => linearPath.push({
                    idx : i,
                    count : d
                }))
                const line = d3.line()
                    .x(d => xScale(d.idx))
                    .y(d => yScale(d.count))
                cellCountGraph.append("path")
                    .attr("id", "cellCountLine")
                    .attr("d", line(linearPath))
                    .attr("fill", "none")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                const tooltipDotRadius = 2;
                const focus = cellCountGraph.append('g')
                    .style("display", "none");
                const tooltipDot = focus.append("circle")
                    .attr('r', tooltipDotRadius);
                let txt = focus.append("text")
                    .attr('y', tooltipHeight / 2);
                function showDetailWhenMousemove() {
                    let x = xScale.invert(d3.pointer(event, this)[0]);
                    x = (x % 1 > 0.5) ? Math.trunc(x) + 1 : Math.trunc(x)
                    if (x < 0) x = 0;
                    if (x > xScale.domain()[1]) x = xScale.domain()[1];
                    txt.text(`idx: ${x},  #: `);

                    let y = data[0].cellCountAcrossIdx[x];
                    tooltipDot
                        .attr("cx", xScale(x))
                        .attr("cy", yScale(y));
                    txt.append("tspan")
                        .text(`${y}`)
                }

                compareDiv.node().appendChild(compareDiv.node().childNodes[2]);

            }
        })
    }
    return { 
        data: data
    }
}()
