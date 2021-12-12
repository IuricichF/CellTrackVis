const datasetNum = 12;
const dtArr = [4, 1, 2, 8, 12, 16]
const algArr = ["lap", "rnn", "cnn30", "cnn40"]
const Overall = "Overall"
const resolutionSideLength = 2040;
const sVGSideLength = 300;
const trkWidth = 10;
const initView1 = function(dt, alg) {
    localStorage.clear();
    let datasetArr;
    const getDt = () => dt;
    const getAlg = () => alg;
    const initToDt = (dt, alg) => {
        d3.select("#view1").selectAll("*").remove();
        datasetArr = [];
        const processRawData = (datasetIdx, dt, rawData) => {
            let trkData = [];
            let trkDataSortedByTrkID = [];
            let idxToTrkIDArr = [];
            let idxToTreeIDArr = [];
            let idxToTrkIDPredArr = [];
            let cellCountAcrossIdx = [];
            let errCountAcrossIdx = [];
            let trkIDToErrTrkIDPredMap = new Map();
            let trkIDToErrPathMap = new Map();
            let trkIDToErrImgIdxMap = new Map();
            let numErrLink = 0;
            let numImg = +rawData[rawData.length - 1].FRAME * dt + 1;

            function getTreeID(d){
                if (d === undefined) return undefined;
                if (+d.track_id_parent === 0) return +d.track_id_unique;
                return getTreeID(rawData.find(dd => dd.track_id_unique === d.track_id_parent));
            }
            rawData.forEach(d => {
                let treeID = getTreeID(d);
                // removes cells with parents that do not exist (error in ground truth)
                if (treeID !== undefined) {
                    for (let i = 0, xTrans = 0, yTrans = 0; i < dt; i++) {
                        if ((d[`dt${i}_n0_dx`] !== undefined)) xTrans = +d[`dt${i}_n0_dx`];
                        if ((d[`dt${i}_n0_dy`] !== undefined)) yTrans = +d[`dt${i}_n0_dx`];
                        trkData.push({
                            imgIdx: +d.FRAME * dt + i,
                            treeID: treeID,
                            trkID: +d.track_id_unique,
                            trkIDPred: +d.track_id_unique_pred,
                            parentTrkID: +d.track_id_parent,
                            x: +d.pos_x + xTrans,
                            y: +d.pos_y + yTrans
                        })
                    }
                    // tracks are sorted by appear frame
                    if (!idxToTrkIDArr.includes(+d.track_id_unique)) {
                        idxToTrkIDArr.push(+d.track_id_unique);
                    }
                    // trees are sorted by id
                    if (!idxToTreeIDArr[treeID]) {
                        idxToTreeIDArr[treeID] = treeID;
                    }
                }
            })
            trkData = trkData.filter(d => d.imgIdx < numImg);
            idxToTreeIDArr = idxToTreeIDArr.filter(d => d !== undefined);
            for (let i = 0; i < idxToTrkIDArr.length; i++) {
                trkDataSortedByTrkID[i] = trkData.filter(d => d.trkID === idxToTrkIDArr[i]);
            }
            const CORRECT_NUM_TRK_ID_PRED = 1;
            trkDataSortedByTrkID.forEach(d => {
                    let temp = d[0].trkIDPred;
                    let tempMapVal = [temp];
                    let tempArr = [];
                    if (!idxToTrkIDPredArr.includes(temp)) tempArr.push(temp);
                    d.forEach(d => {
                        if (d.trkIDPred !== temp) {
                            temp = d.trkIDPred;
                            if (!idxToTrkIDPredArr.includes(temp)) tempArr.push(temp);
                            tempMapVal.push(temp);
                        }
                    })
                    if (tempMapVal.length > CORRECT_NUM_TRK_ID_PRED) {
                        trkIDToErrTrkIDPredMap.set(d[0].trkID, tempMapVal);
                        idxToTrkIDPredArr.push(...tempArr);
                    }
            })
            for (const key of trkIDToErrTrkIDPredMap.keys()) {
                const tempTrk = trkData.filter(d => d.trkID === key);
                const tempTrkIDToErrImgIdxMapVal = [];
                const tempTrkIDToErrPathMapVal = [];
                let tempImgIdx = tempTrk[0].imgIdx;
                for (let i = 1; i < trkIDToErrTrkIDPredMap.get(key).length; i++) {
                    let tempIdx = tempTrk.findIndex(d => d.trkIDPred === trkIDToErrTrkIDPredMap.get(key)[i] && d.imgIdx > tempImgIdx) - 1;
                    let tempPt = tempTrk[tempIdx]
                    tempImgIdx = tempPt.imgIdx;
                    tempTrkIDToErrImgIdxMapVal[i - 1] = [tempPt.imgIdx];
                    tempTrkIDToErrPathMapVal[i - 1] = [[tempPt.x, tempPt.y]];
                    tempPt = trkData.find(d => d.trkIDPred === tempPt.trkIDPred && d.imgIdx === tempPt.imgIdx + 1);
                    if (tempPt !== undefined) {
                        tempTrkIDToErrImgIdxMapVal[i - 1].push(tempPt.imgIdx)
                        tempTrkIDToErrPathMapVal[i - 1].push([tempPt.x, tempPt.y])
                    }
                    trkIDToErrImgIdxMap.set(key, tempTrkIDToErrImgIdxMapVal);
                    trkIDToErrPathMap.set(key, tempTrkIDToErrPathMapVal);
                }
            }
            for (let i = 0; i < numImg; i++) {
                cellCountAcrossIdx.push(trkData.filter(d => d.imgIdx === i).length)
            }
            for (let i = temp = 0; i < numImg; i++) {
                for (const value of trkIDToErrImgIdxMap.values()) {
                    for (const idx of value) {
                        if (idx[1] === i) temp++;
                    }
                }
                errCountAcrossIdx.push(temp)
            }
            numErrLink = errCountAcrossIdx[errCountAcrossIdx.length - 1];
            
            return {
                datasetIdx: datasetIdx,
                numImg: numImg,
                numErrLink: numErrLink,
                trkData: trkData,
                idxToTrkIDArr: idxToTrkIDArr,
                idxToTreeIDArr: idxToTreeIDArr,
                trkDataSortedByTrkID: trkDataSortedByTrkID,
                trkIDToErrTrkIDPredMap: trkIDToErrTrkIDPredMap,
                trkIDToErrPathMap: trkIDToErrPathMap,
                trkIDToErrImgIdxMap: trkIDToErrImgIdxMap,
                cellCountAcrossIdx: cellCountAcrossIdx,
                errCountAcrossIdx: errCountAcrossIdx
            }
        }
        const colorScale = d3.scaleOrdinal()
            .domain([0, algArr.length - 1])
            .range(d3.schemeCategory10);
        let dataReadCount = 0;
        if (alg === Overall) {
            for (let datasetIdx = 1; datasetIdx <= datasetNum; datasetIdx++) {
                let tempArr = [[], []]
                for (let algIdx = 0; algIdx < algArr.length; algIdx++) {
                        d3.csv(`./src/dataset_${datasetIdx}/${algArr[algIdx]}_dt${dt}.csv`)
                            .then(rawData => {
                                tempArr[algIdx] = processRawData(datasetIdx, dt, rawData);
                                dataReadCount++;
                                // run when all data read
                                if (dataReadCount === datasetNum * algArr.length) {
                                    datasetArr.sort((a, b) => (b[0].numErrLink + b[1].numErrLink) - (a[0].numErrLink + a[1].numErrLink));
                                    datasetArr.forEach(d => {
                                        const div = d3.selectAll("#view1").append("div")
                                            .attr("class", "box-content rounded-lg p-2 text-center text-lg relative");
                                        const styleDivBackgroundColor = (() => {
                                                let min = Number.MAX_SAFE_INTEGER;
                                                let minIdxArr = [];
                                                d.forEach((dd, ii) => {
                                                    if (dd.numErrLink < min) {
                                                        min = dd.numErrLink;
                                                        minIdxArr = [ii];
                                                    } else if (dd.numErrLink === min) minIdxArr.push(ii);
                                                })
                                                let bg = '';
                                                if (minIdxArr.length > 1) {
                                                    let deg = 90;
                                                    let pct = 100 / minIdxArr.length;
                                                    for (let i = 0; i < minIdxArr.length; i++) {
                                                        if (minIdxArr.length - i === 2) {
                                                            bg = bg.concat(`linear-gradient(${deg}deg, ${colorScale(minIdxArr[i])} ${(i + 1) * pct}%, ` + 
                                                                `${colorScale(minIdxArr[i + 1])} ${(i + 1) * pct}%`);
                                                            break;
                                                        }
                                                        bg = bg.concat(`linear-gradient(${deg}deg, ${colorScale(minIdxArr[i])} ${(i + 1) * pct}%, ` +
                                                            `rgba(0, 0, 0, 0) ${(i + 1) * pct}%), `);
                                                    }
                                                } else bg = `${colorScale(minIdxArr[0])}`
                                                div.style("background", bg);
                                        })()
                                        div.append("div")
                                            .text(`${d[0].datasetIdx}`)
                                            .attr("class", "absolute -inset-x-1/2 -top-2 bg-gray-100 rounded-full " +  
                                                "h-12 w-12 flex items-center justify-center m-auto font-sans text-3xl")
                                        div.append("br");
                                        const graph1Group = div.append('g');
                                        graph1Group.append("tspan").attr("class", "bg-white px-2")
                                        .append("text").text("Error Link #");
                                        const graphWidth = 250;
                                        const graphHeight = 150;
                                        const tooltipHeight = graphHeight * 0.2
                                        const graphFooterHeight = graphHeight * 0.15;
                                        const graph1 = graph1Group.append("svg")
                                            .attr("width", graphWidth)
                                            .attr("height", graphHeight)
                                            .attr("class", "bg-white m-auto");
                                        const containNoErrorLinkInArray = (arr) => {
                                            for (const data of arr) {
                                                if (data.numErrLink !== 0) return false;
                                            }
                                            return true;
                                        }
                                        if (containNoErrorLinkInArray(d)) {
                                            graph1.append("text")
                                                .text("No Error!")
                                                .attr('x', "50%")
                                                .attr('y', "50%")
                                                .attr('dominant-baseline', "middle")
                                                .attr('text-anchor', "middle")
                                        } else {
                                            let xScale = d3.scaleBand()
                                                .domain(algArr)
                                                .range([0, graphWidth])
                                                .padding(0.1);
                                            const yScale = d3.scaleLinear()
                                                // 0.0000001 is for when input is 0, then the output should 0 as well
                                                .domain([0, Math.max(d[0].numErrLink, d[1].numErrLink) + 0.0000001])
                                                .range([0, graphHeight - tooltipHeight - graphFooterHeight])
                                            d.forEach((dd, ii) => {
                                                graph1.append("rect")
                                                    .attr('x', xScale(algArr[ii]))
                                                    .attr('y', graphHeight - yScale(dd.numErrLink) - graphFooterHeight)
                                                    .attr("width", xScale.bandwidth())
                                                    .attr("height", yScale(dd.numErrLink))
                                                    .attr("fill", colorScale(ii))
                                                let text = graph1.append("text")
                                                    .text(`${dd.numErrLink}`);
                                                text.attr('x', xScale(algArr[ii]) + (xScale.bandwidth() - text.node().getBBox().width) / 2)
                                                    .attr('y', graphHeight - yScale(dd.numErrLink) - graphFooterHeight - tooltipHeight / 6);
                                                text = graph1.append("text")
                                                    .text(algArr[ii]);
                                                text.attr('x', xScale(algArr[ii]) + (xScale.bandwidth() - text.node().getBBox().width) / 2)
                                                .attr('y', graphHeight - text.node().getBBox().height / 3);
                                            })
                                            graph1Group.append("br");

                                            const graph2Group = div.append('g');
                                            graph2Group.append("tspan").attr("class", "bg-white px-2")
                                            .append("text").text("Error Link # vs. Image Index")
                                            const graph2 = graph2Group.append("svg")
                                                .attr("width", graphWidth)
                                                .attr("height", graphHeight)
                                                .attr("class", "bg-white m-auto")
                                                .on("mouseover", () => focus.style("display", null))
                                                .on("mouseout", () => focus.style("display","none"))
                                                .on("mousemove", showDetailWhenMousemove);
                                            const graph2RightPadding = graphWidth * 0.07;
                                            xScale =  d3.scaleLinear()
                                                .domain([0, d[0].numImg - 1]);
                                            const xAxis = graph2.append("g")
                                                .call(d3.axisBottom(xScale));
                                            const graph2BotPadding = xAxis.node().getBoundingClientRect().height;
                                            xAxis.attr("transform", `translate(0, ${graphHeight - graph2BotPadding})`)
                                            const maxTotalErrorLink = (d) => {
                                                let max = 0;
                                                for (const data of d) {
                                                    let temp = data.numErrLink;
                                                    if (temp > max) max = temp;
                                                }
                                                return max;
                                            }
                                            yScale.domain([0, maxTotalErrorLink(d)]);
                                            const yAxis = graph2.append("g")
                                                .call(d3.axisLeft(yScale));
                                            const graph2LeftPadding = yAxis.node().getBoundingClientRect().width;
                                            yAxis.attr("transform", `translate(${graph2LeftPadding}, 0)`)
                                            xScale.range([graph2LeftPadding, graphWidth - graph2RightPadding]);
                                            xAxis.call(d3.axisBottom(xScale).ticks(5));
                                            yScale.range([graphHeight - graph2BotPadding, tooltipHeight]);
                                            yAxis.call(d3.axisLeft(yScale));

                                            const line = d3.line()
                                                .x(d => xScale(d.x))
                                                .y(d => yScale(d.y));
                                            const graph2PathData = [];
                                            d.forEach(dd => {
                                                let temp = [];
                                                dd.errCountAcrossIdx.forEach((ddd, iii) => {
                                                    temp.push({
                                                        x : iii,
                                                        y : ddd
                                                    })
                                                })
                                                graph2PathData.push(temp);
                                            })
                                            graph2.append('g').selectAll("path")
                                                .data(graph2PathData)
                                                .enter()
                                                .append("path")
                                                .attr("d", dd => line(dd))
                                                .attr("fill", "none")
                                                .attr("stroke", (dd, ii) => colorScale(ii))
                                                .attr("stroke-width", 1);
                                            const tooltipDotRadius = 2;
                                            const focus = graph2.append('g')
                                                .style("display", "none");
                                            const tooltipDotArr = [];
                                            d.forEach((dd, ii) => {
                                                tooltipDotArr.push(
                                                    focus.append("circle")
                                                        .attr('r', tooltipDotRadius)
                                                        .attr("fill", colorScale(ii))
                                                );
                                            })
                                            let txt = focus.append("text")
                                                .attr('y', tooltipHeight / 2);
                                            function showDetailWhenMousemove() {
                                                let x = xScale.invert(d3.pointer(event, this)[0]);
                                                x = (x % 1 > 0.5) ? Math.trunc(x) + 1 : Math.trunc(x)
                                                if (x < 0) x = 0;
                                                if (x > xScale.domain()[1]) x = xScale.domain()[1];
                                                txt.text(`idx: ${x},  #: `);
                                                d.forEach((dd, ii) => {
                                                    let y = dd.errCountAcrossIdx[x];
                                                    tooltipDotArr[ii]
                                                        .attr("cx", xScale(x))
                                                        .attr("cy", yScale(y));
                                                    txt.append("tspan")
                                                        .text(`${y}`)
                                                        .style("fill", colorScale(ii));
                                                    if (ii !== d.length - 1) {
                                                        txt.append("tspan")
                                                            .text(", ");
                                                    }
                                                })
                                            }
                                        }
                                    })
                               }
                        })
                }
                datasetArr.push(tempArr);
            }
        } else {
            for (let datasetIdx = 1; datasetIdx <= datasetNum; datasetIdx++) {
                d3.csv(`./src/dataset_${datasetIdx}/${alg}_dt${dt}.csv`).then(rawData => {
                    datasetArr.push(processRawData(datasetIdx, dt, rawData));
                    if (datasetArr.length === datasetNum) {
                        datasetArr.sort((a, b) => b.trkIDToErrTrkIDPredMap.size - a.trkIDToErrTrkIDPredMap.size);
                        datasetArr.forEach(d => {
                            const div = d3.selectAll("#view1").append("div")
                                .attr("class", "box-content bg-gray-200 rounded-lg p-2 justify-center");
                            const fieldOfView = div.append("div")
                            const errLinkWindow = fieldOfView
                                .append("svg")
                                .attr("id", `sVG${d.datasetIdx}`)
                                .attr("width", sVGSideLength)
                                .attr("height", sVGSideLength)
                                .attr("style", "background-color:white")
                                .attr("class", "shadow")
                                .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`)
                                .on("click", openDialog)
                                .append("g")
                                .attr("id", `errorLink${d.datasetIdx}`);
                            const ul = div.append("div")
                                .attr("class", "box-content p-2 self-center text-center")
                                .append("ul")
                                .attr("class", "list-dic");
    
                            let numlinkErr = 0;
                            for (const value of d.trkIDToErrTrkIDPredMap.values()) numlinkErr += value.length - 1;
                            let numlink = d.trkData.length - d.idxToTrkIDArr.length;
                            ul.append("li").text(`Field of view - #${d.datasetIdx}`);
                            ul.append("li").text(`Linking errors - ${numlinkErr}`);
                            ul.append("li").text(`Linking errors (%) - ${(numlinkErr / numlink * 100).toFixed(2)}%`);
                            ul.append("li").text(`Total links - ${numlink}`);
                            ul.append("li").text(`Cell count (0-${d.numImg - 1}) ;
                                - ${d.cellCountAcrossIdx[0]}-${d.cellCountAcrossIdx[d.cellCountAcrossIdx.length - 1]}`);
                            
                            const graphWidth = 250;
                            const graphHeight = 150;
                            const tooltipHeight = graphHeight * 0.2
                            const cellCountGraph = ul.append("svg")
                                                .attr("width", graphWidth)
                                                .attr("height", graphHeight)
                                                .attr("class", "bg-white m-auto")
                                                .on("mouseover", () => focus.style("display", null))
                                                .on("mouseout", () => focus.style("display","none"))
                                                .on("mousemove", showDetailWhenMousemove);
                            const cellCountGraphRightPadding = graphWidth * 0.07;    
                            const xScale = d3.scaleLinear()
                                .domain([0, d.numImg - 1]);
                            const xAxis = cellCountGraph.append("g")
                                .call(d3.axisBottom(xScale));
                            const cellCountGraphBotPadding = xAxis.node().getBoundingClientRect().height;
                            xAxis.attr("transform", `translate(0, ${graphHeight - cellCountGraphBotPadding})`)
                            const yScale = d3.scaleLinear().domain([Math.min(...d.cellCountAcrossIdx), Math.max(...d.cellCountAcrossIdx)]);
                            const yAxis = cellCountGraph.append("g")
                                .call(d3.axisLeft(yScale));
                            const cellCountGraphLeftPadding = yAxis.node().getBoundingClientRect().width;
                            yAxis.attr("transform", `translate(${cellCountGraphLeftPadding}, 0)`)
                            xScale.range([cellCountGraphLeftPadding, graphWidth - cellCountGraphRightPadding]);
                            xAxis.call(d3.axisBottom(xScale).ticks(5));
                            yScale.range([graphHeight - cellCountGraphBotPadding, tooltipHeight]);
                            yAxis.call(d3.axisLeft(yScale));
                                                        
                            const linearPath = [];
                            d.cellCountAcrossIdx.forEach((d, i) => linearPath.push({
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

                                let y = d.cellCountAcrossIdx[x];
                                tooltipDot
                                    .attr("cx", xScale(x))
                                    .attr("cy", yScale(y));
                                txt.append("tspan")
                                    .text(`${y}`)
                            }
                            
                            window.addEventListener('resize', () => {
                                const rate = this.outerWidth / this.screen.availWidth;
                                d3.select(`#sVG${d.datasetIdx}`)
                                    .attr("width", sVGSideLength * rate)
                                    .attr("height", sVGSideLength * rate);
                                cellCountGraph
                                    .attr("width", graphWidth * rate)
                                    .attr("height", graphHeight * rate);
                            })
    
                            const errLinkPathData = [];
                            for (const value of d.trkIDToErrPathMap.values()) {
                                for (const point of value) {
                                    errLinkPathData.push(point);
                                }
                            }
                            if (errLinkPathData.length === 0) {
                                const text = errLinkWindow.append("text")
                                    .attr("id", `noErrorText${d.datasetIdx}`)
                                    .attr("y", resolutionSideLength / 2)
                                    .attr("style", "font: 100px sans-serif")
                                    .text("Congratulation, this dataset has no error!");
                                const tempWidth = document.getElementById(`noErrorText${d.datasetIdx}`).getBBox().width
                                text.attr("x", (resolutionSideLength - tempWidth) / 2)
                            }
                            else {
                                errLinkWindow.selectAll("circle")
                                    .data(errLinkPathData)
                                    .enter()
                                    .append("circle")
                                    .attr("cx", d => d[0][0])
                                    .attr("cy", d => d[0][1])
                                    .attr("r", trkWidth * 1.5)
                                    .attr("fill", colorScale(algArr.indexOf(alg)));
                    
                                errLinkWindow.selectAll("path")
                                    .data(errLinkPathData)
                                    .enter()
                                    .append("path")
                                    .attr("d", d => d3.line()(d))
                                    .attr("fill", "none")
                                    .attr("stroke", colorScale(algArr.indexOf(alg)))
                                    .attr("stroke-width", trkWidth);
                            }
                            function transferDataToView2(element, alg1, alg2) {
                                const offset = 3;
                                localStorage.setItem("resolutionSideLength", resolutionSideLength);
                                localStorage.setItem("datasetIdx", +element.getAttribute("id").slice(offset));
                                localStorage.setItem("dt", dt);
                                localStorage.setItem("processRawData", processRawData.toString());
                                localStorage.setItem("algArr", JSON.stringify([alg1, alg2]));
                                localStorage.setItem("algColorArr", JSON.stringify([colorScale(algArr.indexOf(alg1)), colorScale(algArr.indexOf(alg2))]));
                            }
                            function openDialog() {
                                const currAlg = view1.getAlg();
                                const select = d3.select("#algToCompareSelect");
                                select.selectAll("option").remove();
                                select.append("option");
                                for (const alg of algArr) {
                                    if (alg !== currAlg) select.append("option").text(alg)
                                }
                                d3.select("#algToCompareConfirm").on("click", () => {
                                    transferDataToView2(this, view1.getAlg(), algToCompareSelect.value); 
                                    window.open('./view2.html', '_blank');
                                })
                                algToCompare.showModal();
                            }
                        })
                    }
                })
            }
        }
    }
    initToDt(dt, alg)

    return {
        initToDt: initToDt,
        getDt: getDt,
        getAlg: getAlg,
        datasetArr: datasetArr
    }
}
var view1 = initView1(dtArr[0], Overall);


