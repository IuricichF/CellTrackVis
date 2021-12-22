const datasetNum = 12;
const dtArr = [4, 1, 2, 8, 12, 16]
const algArr = ["lap", "rnn", "cnn30", "cnn40"]
const Overall = "Overall"
const resolutionSideLength = 2040;
const trkWidth = 10;
const initView1 = function(dt, alg) {
    let datasetArr;
    const getDt = () => dt;
    const getAlg = () => alg;
    let transferDataToView2;
    let transferDataToView3;
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
        transferDataToView2 = (datasetIdx, alg1, alg2) => {
            localStorage.setItem("resolutionSideLength", resolutionSideLength);
            localStorage.setItem("datasetIdx", datasetIdx);
            localStorage.setItem("dt", dt);
            localStorage.setItem("processRawData", processRawData.toString());
            localStorage.setItem("algArr", JSON.stringify([alg1, alg2]));
            localStorage.setItem("algColorArr", JSON.stringify([colorScale(algArr.indexOf(alg1)), colorScale(algArr.indexOf(alg2))]));
        }
        transferDataToView3 = (index, alg) => {
            let data;
            d3.csv(`./src/dataset_${index}/${alg}_dt${dt}.csv`).then(rawData => {
                data = processRawData(index, dt, rawData);
                localStorage.setItem("datasetIdx", data.datasetIdx);
                localStorage.setItem("numImg", data.numImg);
                localStorage.setItem("numTree", data.idxToTreeIDArr.length);
                localStorage.setItem("resolutionSideLength", resolutionSideLength);
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
            })
        }
        const colorScale = d3.scaleOrdinal()
            .domain([...Array(algArr.length).keys()])
            .range(d3.schemeSet2);
        let dataReadCount = 0;
        if (single_fov === undefined) {
            if (alg === Overall) {
                for (let datasetIdx = 1; datasetIdx <= datasetNum; datasetIdx++) {
                    let tempArr = []
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
                                                .attr("class", "box-content rounded-lg p-4 text-base relative bg-gray-900");
                                            const fovid = div.append("div")
                                                .text(`${d[0].datasetIdx}`)
                                                .attr("id", "name-fov")
                                                .attr("class", "absolute -inset-x-1/2 -top-2 bg-gray-100 rounded-full " +  
                                                    "h-12 w-12 flex items-center justify-center m-auto font-sans text-3xl")
                                            
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
    
                                                    console.log(bg)
                                                    fovid.style("background", bg);
                                            })()
    
                                            div.append("div").attr("class", "pt-10")
                                            const barchartdiv = div.append("div").attr("class", "border-t pb-6");
                                            const graph1Group = barchartdiv.append('g');
                                            graph1Group.append("tspan").attr("class", "text-gray-400")
                                            .append("text").text("Total linking errors per algorithm");
                                            const graphWidth = 250;
                                            const graphHeight = 150;
                                            const tooltipHeight = graphHeight * 0.2
                                            const graphFooterHeight = graphHeight * 0.15;
                                            const graph1 = graph1Group.append("svg")
                                                .attr("width", graphWidth)
                                                .attr("height", graphHeight)
                                                .attr("class", "bg-gray-900 m-auto")
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
                                                    .attr("fill", "#9ca3af");
                                            } else {
                                                let xScale = d3.scaleBand()
                                                    .domain(algArr)
                                                    .range([0, graphWidth])
                                                    .padding(0.1);
                                                const yScaleBars = d3.scaleLinear()
                                                    // 0.0000001 is for when input is 0, then the output should 0 as well
                                                    .domain([0, Math.max(d[0].numErrLink, d[1].numErrLink) + 0.0000001])
                                                    .range([0, graphHeight - tooltipHeight - graphFooterHeight])
                                                
                                                const myBars = []
                                                const myText = []
                                                d.forEach((dd, ii) => {
                                                    console.log(ii, dd)
                                                    myBars.push(
                                                        graph1.append("rect")
                                                            .attr('x', xScale(algArr[ii]))
                                                            .attr('y', graphHeight - yScaleBars(dd.numErrLink) - graphFooterHeight)
                                                            .attr("width", xScale.bandwidth())
                                                            .attr("height", yScaleBars(dd.numErrLink))
                                                            .attr("class","bars-"+dd.datasetIdx)
                                                            .attr("fill", colorScale(ii))
                                                    )
                                                        let text = graph1.append("text")
                                                            .text(`${dd.numErrLink}`);
                                                        text.attr('x', xScale(algArr[ii]) + (xScale.bandwidth() - text.node().getBBox().width) / 2)
                                                            .attr('y', graphHeight - yScaleBars(dd.numErrLink) - graphFooterHeight - tooltipHeight / 6)
                                                            .attr("fill", colorScale(ii));
                                                        myText.push(text)
                                                        
                                                        text = graph1.append("text")
                                                            .text(algArr[ii]);
                                                        text.attr('x', xScale(algArr[ii]) + (xScale.bandwidth() - text.node().getBBox().width) / 2)
                                                            .attr('y', graphHeight - text.node().getBBox().height / 3)
                                                            .attr("fill", colorScale(ii));
    
                                                        
                                                })
    
                                                const linechartdiv = div.append("div").attr("class", "border-t");
                                                const graph2Group = linechartdiv.append('g');
                                                graph2Group.append("tspan").attr("class", "px-2 text-gray-400")
                                                .append("text").text("Linking errors over time")
                                                const graph2 = graph2Group.append("svg")
                                                    .attr("width", graphWidth)
                                                    .attr("height", graphHeight)
                                                    .attr("class", "bg-gray-900 m-auto")
                                                    .on("mouseover", showDetailWhenMousemove)
                                                    .on("mouseout",  resetCard)
                                                    .on("mousemove", showDetailWhenMousemove);
                                                const graph2RightPadding = graphWidth * 0.07;
                                                xScale =  d3.scaleLinear()
                                                    .domain([0, d[0].numImg - 1]);
                                                const xAxis = graph2.append("g")
                                                    .call(d3.axisBottom(xScale))
                                                    .attr("stroke", "#9ca3af");
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
                                                const yScale = d3.scaleLinear()
                                                        .domain([0, maxTotalErrorLink(d)]);
                                                const yAxis = graph2.append("g")
                                                    .call(d3.axisLeft(yScale))
                                                    .attr("stroke", "#9ca3af");;
                                                const graph2LeftPadding = yAxis.node().getBoundingClientRect().width;
                                                yAxis.attr("transform", `translate(${graph2LeftPadding}, 0)`)
                                                xScale.range([graph2LeftPadding, graphWidth - graph2RightPadding]);
                                                xAxis.call(d3.axisBottom(xScale).ticks(5)).attr("stroke", "#9ca3af");;
                                                yScale.range([graphHeight - graph2BotPadding, tooltipHeight]);
                                                yAxis.call(d3.axisLeft(yScale).ticks(8)).attr("stroke", "#9ca3af");;
    
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
                                                const tooltipDotArr = [];
                                                d.forEach((dd, ii) => {
                                                    tooltipDotArr.push(
                                                        focus.append("circle")
                                                            .attr('r', tooltipDotRadius)
                                                            .attr("opacity", 0)
                                                            .attr("fill", colorScale(ii))
                                                    );
                                                })
                                                let txt = focus.append("text")
                                                    .attr('y', tooltipHeight / 2)
                                                    .attr("fill", "#9ca3af");
    
                                                function resetCard() {
                                                    d.forEach((dd, ii) => {
                                                        tooltipDotArr[ii]
                                                            .attr("opacity", 0)
    
                                                        myBars[ii]
                                                            .attr('y', graphHeight - yScaleBars(dd.numErrLink) - graphFooterHeight)
                                                            .attr("height", yScaleBars(dd.numErrLink))
    
                                                        myText[ii]
                                                            .text(`${dd.numErrLink}`)
                                                            .attr('y', graphHeight - yScaleBars(dd.numErrLink) - graphFooterHeight - tooltipHeight / 6)
                                                    })
                                                }
    
                                                function showDetailWhenMousemove() {
                                                    let x = xScale.invert(d3.pointer(event, this)[0]);
                                                    x = (x % 1 > 0.5) ? Math.trunc(x) + 1 : Math.trunc(x)
                                                    if (x < 0) x = 0;
                                                    if (x > xScale.domain()[1]) x = xScale.domain()[1];
                                                    
                                                    d.forEach((dd, ii) => {
                                                        let y = dd.errCountAcrossIdx[x];
                                                        tooltipDotArr[ii]
                                                            .attr("opacity", 1)
                                                            .attr("cx", xScale(x))
                                                            .attr("cy", yScale(y));
    
                                                        myBars[ii]
                                                            .attr('y', graphHeight - yScaleBars(y) - graphFooterHeight)
                                                            .attr("height", yScaleBars(y))
    
                                                        myText[ii]
                                                            .text(`${y}`)
                                                            .attr('y', graphHeight - yScaleBars(y) - graphFooterHeight - tooltipHeight / 6)
    
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
                                const sVGSideLength = 270;
                                const errLinkWindow = fieldOfView
                                    .append("svg")
                                    .attr("id", `sVG${d.datasetIdx}`)
                                    .attr("width", sVGSideLength)
                                    .attr("height", sVGSideLength)
                                    .attr("class", "shadow bg-white m-auto")
                                    .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`)
                                    .on("click", openDialog)
                                    .append("g")
                                    .attr("id", `errorLink${d.datasetIdx}`);
                                const ul = div.append("div")
                                    .attr("class", "box-content p-2 text-center")
                                    .append("ul")
                                    .attr("class", "list-dic");
        
                                let numlinkErr = 0;
                                for (const value of d.trkIDToErrTrkIDPredMap.values()) numlinkErr += value.length - 1;
                                let numlink = d.trkData.length - d.idxToTrkIDArr.length;
                                ul.append("li").text(`Field of view - #${d.datasetIdx}`);
                                ul.append("li").text(`Linking errors - ${numlinkErr}`);
                                ul.append("li").text(`Linking errors (%) - ${(numlinkErr / numlink * 100).toFixed(2)}%`);
                                ul.append("li").text(`Total links - ${numlink}`);
                                
                                const graphWidth = 250;
                                const graphHeight = 150;
                                const tooltipHeight = graphHeight * 0.2;
                                const cellCountGraphGroup = ul.append("g");
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
        } else {
            transferDataToView3(fovOption.value, algorithmOption.value);
        }

    }
    initToDt(dt, alg)

    return {
        initToDt: initToDt,
        getDt: getDt,
        getAlg: getAlg,
        transferDataToView2: transferDataToView2,
        transferDataToView3: transferDataToView3,
        datasetArr: datasetArr
    }
}