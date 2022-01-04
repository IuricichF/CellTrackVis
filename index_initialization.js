const datasetNum = 12;
const dtArr = [4, 1, 2, 8, 12, 16];
const allAlgArr = ["lap", "rnn", "cnn30", "cnn40"];
// const dtArr = [4];
// const allAlgArr = ["lap"];
let algArr = [];
const colorScale = d3.scaleOrdinal()
    .domain([...Array(allAlgArr.length).keys()])
    .range(d3.schemeSet2);
const views = ["index", "overall", "single_alg", "single_fov"];
const resolutionSideLength = 2040;
const trkWidth = 10;
let ini

//INITIALIZATION OF DATASET STRUCTURE
const initialization = (dt) => {
    const data = []
    const processRawData = (datasetIdx, dt, alg, rawData) => {
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
            dt: dt,
            algorithm: alg,
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
    const readData = (() => {
        dataReadCount = 0;
        for (let datasetIdx = 1; datasetIdx <= datasetNum; datasetIdx++) {
            let tempData = [];
            for (let algIdx = 0; algIdx < allAlgArr.length; algIdx++) {
                d3.csv(`./src/dataset_${datasetIdx}/${allAlgArr[algIdx]}_dt${dt}.csv`).then(rawData => {
                    if (algArr.findIndex(d => d === allAlgArr[algIdx]) === -1) algArr.push(allAlgArr[algIdx]);
                    tempData[algIdx] = processRawData(datasetIdx, dt, allAlgArr[algIdx], rawData);
                    dataReadCount++;
                    if (dataReadCount === datasetNum * algArr.length) {
                        const initializeAlgSelect = ((id) => {
                            single_alg_alg_select.innerHTML = '';
                            for (const alg of algArr) {
                                d3_single_alg_alg_select.append("option")
                                    .text(`${alg}`);
                            }

                            single_fov_alg_select.innerHTML = '';
                            for (const alg of algArr) {
                                d3_single_fov_alg_select.append("option")
                                    .text(`${alg}`);
                            }

                            single_fov_alg2_select.innerHTML = '';
                            d3_single_fov_alg2_select.append("option").text("none");
                            for (const alg of algArr) {
                                if (alg !== single_fov_alg_select.value) {
                                    d3_single_fov_alg2_select.append("option")
                                    .text(`${alg}`);
                                }
                            }
                        })();
                        displaySingleFOVAndHideComparison();
                        initializeAndBuildSingleFOVView(single_fov_alg_select.value, +single_fov_idx_select.value);
                        // when initialize the page by changing the frame rate at overview
                        if (d3.select("#selected_view_span").node() !== null) {
                            displayOneViewAndHideOthers(views[1]);
                            initializeAndBuildOverallView();
                        }
                        d3.select("#dashboard_view").style("display", null);
                    }
                }, (error) => {
                    console.log(`dataset_${datasetIdx} does not have ${allAlgArr[algIdx]}_dt${dt}.csv`);
                })
            }
            data[datasetIdx - 1] = tempData;
        }
    })();
    const displayOneViewAndHideOthers = (view) => { 
        const dashboardOptions = [...views];
        dashboardOptions.shift();
        const displays = [...views];
        const d3DashboardOption = d3.select("#dashboard_option");
        d3.select("#selected_view_span").remove();
        if (view === views[0]) d3DashboardOption.style("display", "none");
        else {
            d3DashboardOption.style("display", null);
            for (const option of dashboardOptions) {
                const d3Option = d3.select(`#${option}_option`);
                if (option === view) {
                    d3Option.style("display", null);
                    d3.select(`#dashboard_${option}_view`).append("span")
                        .attr("id", "selected_view_span")
                        .attr("class", "absolute top-0 left-0 w-2 h-2 mt-2 ml-2 bg-indigo-500 rounded-full");
                }
                else d3Option.style("display", "none");
            }
        }

        for (const display of displays) {
            const d3Display = d3.select(`#${display}_display`);
            if (display === view) {
                d3Display.style("display", null);
            }
            else d3Display.style("display", "none");
        }
    }
    const buildOverallView = () => {
        data.sort((a, b) => (b.reduce((aa, bb) => aa + (bb.numErrLink || 0), 0)) 
            - ((a.reduce((aa, bb) => aa + (bb.numErrLink || 0), 0))));
        data.forEach(d => { 
            const div = d3.selectAll("#overall_div").append("div")
            .attr("class", "box-content rounded-lg p-4 text-base relative bg-gray-900");
            const fovid = div.append("div")
                .text(`${d[0].datasetIdx}`)
                .attr("id", "name-fov")
                .attr("class", "absolute -inset-x-1/2 -top-2 bg-gray-100 rounded-full " +  
                    "h-12 w-12 flex items-center justify-center m-auto font-sans text-3xl")
            const styleFOVIDBackgroundColor = (() => {
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

                fovid.style("background", bg);
            })()
            div.append("div").attr("class", "pt-10")

            const barchartDiv = div.append("div").attr("class", "border-t pb-6");
            const barchartGroup = barchartDiv.append('g');
            barchartGroup.append("tspan").attr("class", "text-gray-400")
                .append("text").text("Total linking errors per algorithm");
            const graphWidth = 250;
            const graphHeight = 150;
            const tooltipHeight = graphHeight * 0.2
            const graphFooterHeight = graphHeight * 0.15;
            const barChart = barchartGroup.append("svg")
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
                barChart.append("text")
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
                    .domain([0, Math.max.apply(Math, d.map(dd => dd.numErrLink)) + 0.0000001])
                    .range([0, graphHeight - tooltipHeight - graphFooterHeight])
                
                const myBars = []
                const myText = []
                d.forEach((dd, ii) => {
                    myBars.push(
                        barChart.append("rect")
                            .attr('x', xScale(algArr[ii]))
                            .attr('y', graphHeight - yScaleBars(dd.numErrLink) - graphFooterHeight)
                            .attr("width", xScale.bandwidth())
                            .attr("height", yScaleBars(dd.numErrLink))
                            .attr("class","bars-"+dd.datasetIdx)
                            .attr("fill", colorScale(ii))
                    )
                    let text = barChart.append("text")
                        .text(`${dd.numErrLink}`);
                    text.attr('x', xScale(algArr[ii]) + (xScale.bandwidth() - text.node().getBBox().width) / 2)
                        .attr('y', graphHeight - yScaleBars(dd.numErrLink) - graphFooterHeight - tooltipHeight / 6)
                        .attr("fill", colorScale(ii));
                    myText.push(text)
                    
                    text = barChart.append("text")
                        .text(algArr[ii]);
                    text.attr('x', xScale(algArr[ii]) + (xScale.bandwidth() - text.node().getBBox().width) / 2)
                        .attr('y', graphHeight - text.node().getBBox().height / 3)
                        .attr("fill", colorScale(ii));
                })
                    const lineChartDiv = div.append("div").attr("class", "border-t");
                    const lineChartGroup = lineChartDiv.append('g');
                    lineChartGroup.append("tspan").attr("class", "px-2 text-gray-400")
                        .append("text").text("Linking errors over time");
                    const lineChart = lineChartGroup.append("svg")
                        .attr("width", graphWidth)
                        .attr("height", graphHeight)
                        .attr("class", "bg-gray-900 m-auto")
                        .on("mouseover", showDetailWhenMousemove)
                        .on("mouseout",  resetCard)
                        .on("mousemove", showDetailWhenMousemove);
                    
                    const lineChartRightPadding = graphWidth * 0.07;
                    xScale =  d3.scaleLinear()
                        .domain([0, d[0].numImg - 1]);
                    const xAxis = lineChart.append("g")
                        .call(d3.axisBottom(xScale))
                        .attr("stroke", "#9ca3af");
                    const lineChartBotPadding = xAxis.node().getBoundingClientRect().height;
                    xAxis.attr("transform", `translate(0, ${graphHeight - lineChartBotPadding})`)
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
                    const yAxis = lineChart.append("g")
                        .call(d3.axisLeft(yScale))
                        .attr("stroke", "#9ca3af");
                    const lineChartLeftPadding = yAxis.node().getBoundingClientRect().width;
                    yAxis.attr("transform", `translate(${lineChartLeftPadding}, 0)`)
                    xScale.range([lineChartLeftPadding, graphWidth - lineChartRightPadding]);
                    xAxis.call(d3.axisBottom(xScale).ticks(5)).attr("stroke", "#9ca3af");
                    yScale.range([graphHeight - lineChartBotPadding, tooltipHeight]);
                    yAxis.call(d3.axisLeft(yScale).ticks(8)).attr("stroke", "#9ca3af");

                    const line = d3.line()
                        .x(d => xScale(d.x))
                        .y(d => yScale(d.y));
                    const lineChartPathData = [];
                    d.forEach(dd => {
                        let temp = [];
                        dd.errCountAcrossIdx.forEach((ddd, iii) => {
                            temp.push({
                                x : iii,
                                y : ddd
                            })
                        })
                        lineChartPathData.push(temp);
                    })
                    lineChart.append('g').selectAll("path")
                        .data(lineChartPathData)
                        .enter()
                        .append("path")
                        .attr("d", dd => line(dd))
                        .attr("fill", "none")
                        .attr("stroke", (dd, ii) => colorScale(ii))
                        .attr("stroke-width", 1);
                    const tooltipDotRadius = 2;
                    const focus = lineChart.append('g')
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
    const initializeAndBuildOverallView = () => {
        overall_div.innerHTML = '';
        buildOverallView();
    }


    //SINGLE ALGORITHM VIEW
    const buildSingleAlgView = (alg) => {
        const singleAlgViewData = data.map(d => d.find(dd => dd.algorithm === alg));
        singleAlgViewData.sort((a, b) => b.numErrLink - a.numErrLink);
        const d3_single_alg_div = d3.selectAll("#single_alg_div")
        singleAlgViewData.forEach(d => {

            let numlinkErr = 0;
            for (const value of d.trkIDToErrTrkIDPredMap.values()) numlinkErr += value.length - 1;
            let numlink = d.trkData.length - d.idxToTrkIDArr.length;


            const div = d3_single_alg_div.append("div")
                .attr("class", "box-content rounded-lg pt-4 pl-2 pr-2 text-base relative bg-gray-900");

            const fovid = div.append("div")
                .text(`${d.datasetIdx}`)
                .attr("id", "name-fov")
                .attr("class", "absolute -inset-x-1/2 -top-2 bg-gray-100 rounded-full " +  
                    "h-12 w-12 flex items-center justify-center m-auto font-sans text-3xl")
                .style("background", colorScale(algArr.indexOf(alg)))

            const fieldOfView = div.append("div").attr("class", "pt-4")

            const fieldOfViewErrors = div.append("div").attr("class", "pb-2");
            const fieldOfViewGroup = fieldOfViewErrors.append('g');
            fieldOfViewGroup.append("tspan").attr("class", "text-gray-400")
                .append("text").text("Linking errors");

            const sVGSideLength = 270;
            const errLinkWindow = fieldOfViewGroup
                .append("svg")
                .attr("id", `sVG${d.datasetIdx}`)
                .attr("width", sVGSideLength)
                .attr("height", sVGSideLength)
                .attr("class", "shadow border m-auto")
                .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`)
                .append("g")
                .attr("id", `error_link${d.datasetIdx}`);

            fieldOfViewGroup.append("p").attr("class", "text-sm mr-4 text-right text-gray-400")
                .append("text").text(`Total errors - `)
                .append("text").text(` ${numlinkErr}`).style("color", colorScale(algArr.indexOf(alg)));
            fieldOfViewGroup.append("p").attr("class", "text-sm mr-4 text-right text-gray-400")
                .append("text").text(`Total links  - ${numlink}`)
                

            const fieldOfViewInfo = div.append("div");
            
            const fieldOfViewInfoGroup = fieldOfViewInfo.append('g');
            fieldOfViewInfoGroup.append("tspan").attr("class", "text-gray-400")
                .append("text").text("Cells number");

            const gridCellInfo = fieldOfViewInfoGroup.append("div").attr("class","border-t")
                
            
            const linechart = gridCellInfo.append("div").attr("class","pt-2")
            const cellCountGraph = linechart.append("svg")
                                .attr("class", "m-auto")
                                .on("mouseover", showDetailWhenMousemove)
                                .on("mouseout", resetLine)
                                .on("mousemove", showDetailWhenMousemove);

            const graphWidth = parseInt(cellCountGraph.style('width'));
            const graphHeight = parseInt(cellCountGraph.style('height'));
            
            const leftPadding = 30
            const bottomPadding = 30

            console.log(graphWidth,graphHeight)

            const xScale = d3.scaleLinear()
                .domain([0, d.numImg - 1])
                .range([leftPadding, graphWidth - leftPadding]);
            
            
            console.log(d3.extent([...d.cellCountAcrossIdx]))

            const yScale = d3.scaleLinear()
                            .domain(d3.extent([...d.cellCountAcrossIdx]))
                            .range([graphHeight - bottomPadding, 2]);
            
                                        
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
                .attr("stroke", colorScale(algArr.indexOf(alg)))
                .attr("stroke-width", 1)
            
            
            const xAxis = cellCountGraph.append("g")
                        .attr("transform", `translate(0, ${graphHeight-bottomPadding})`)
                        .call(d3.axisBottom(xScale).ticks(8))
                        .attr("stroke", "#9ca3af");

            const yAxis = cellCountGraph.append("g")
                          .attr("transform", `translate(${leftPadding}, 0)`)
                          .call(d3.axisLeft(yScale))
                          .attr("stroke", "#9ca3af");
            
            
            
            const tooltipDotRadius = 2;
            const tooltipDot = cellCountGraph. append("circle")
                .attr('opacity', 0)
                .attr('r', tooltipDotRadius)
                .attr('fill', colorScale(algArr.indexOf(alg)));

            const tooltipLine = cellCountGraph. append("line")
                .attr('opacity', 0)
                .attr('x1', leftPadding)
                .attr('y1', 0)
                .attr('x2', graphWidth - leftPadding)
                .attr('y2', 0)
                .attr('stroke', colorScale(algArr.indexOf(alg)));
            
            
            function showDetailWhenMousemove() {
                let x = xScale.invert(d3.pointer(event, this)[0]);
                x = (x % 1 > 0.5) ? Math.trunc(x) + 1 : Math.trunc(x)
                if (x < 0) x = 0;
                if (x > xScale.domain()[1]) x = xScale.domain()[1];

                let y = d.cellCountAcrossIdx[x];
                tooltipDot
                    .attr('opacity', 1)
                    .attr("cx", xScale(x))
                    .attr("cy", yScale(y));

                tooltipLine
                    .attr('opacity', 0.3)
                    .attr('y1', yScale(y))
                    .attr('y2', yScale(y))

            }

            function resetLine() {
                
                tooltipDot
                    .attr('opacity', 0)

                tooltipLine
                    .attr('opacity', 0)
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
                    .text("Congratulation, this dataset has no error!")
                    .attr("fill", "#9ca3af");
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
        })
    }
    const initializeAndBuildSingleAlgView = (alg) => {
        single_alg_div.innerHTML = '';
        buildSingleAlgView(alg);
    }
    const buildSingleFOVView = (alg, datasetIdx) => {
        const singleFOVViewData = data.find(d => d[0].datasetIdx === datasetIdx).find(d => d.algorithm === alg)

        const numImg = singleFOVViewData.numImg;
        const trkIDToErrPathMap = singleFOVViewData.trkIDToErrPathMap;
        const trkIDToErrImgIdxMap = singleFOVViewData.trkIDToErrImgIdxMap;
        const trkDataSortedByTrkID = singleFOVViewData.trkDataSortedByTrkID;
        const trkData = singleFOVViewData.trkData;

        let idxToTreeIDWithErrArr = [];
        for (const key of trkIDToErrImgIdxMap.keys()) {
            let tempTreeID = trkData.find(d => d.trkID === key).treeID;
            if (!idxToTreeIDWithErrArr.includes(tempTreeID)) idxToTreeIDWithErrArr.push(tempTreeID);
        }
        
        const idxToTrkIDWithErrArr = singleFOVViewData.idxToTrkIDArr.filter((d => idxToTreeIDWithErrArr.includes(trkData.find(d2 => d2.trkID === d).treeID)));
        const idxToErrTrkIDArr = singleFOVViewData.idxToTrkIDArr.filter(d => trkIDToErrImgIdxMap.has(d));
        idxToTreeIDWithErrArr = idxToTreeIDWithErrArr.filter(d => d !== undefined);
        const idxToTreeIDNoErrArr = singleFOVViewData.idxToTreeIDArr.filter(d => !idxToTreeIDWithErrArr.includes(d));
        const idxToTrkIDNoErrArr = singleFOVViewData.idxToTrkIDArr.filter(d => !idxToTrkIDWithErrArr.includes(d))

        const numTrkWithErr = idxToTrkIDWithErrArr.length;
        const numTrkNoErr = idxToTrkIDNoErrArr.length;
        const numTreeWithErr = idxToTreeIDWithErrArr.length;
        const numTreeNoErr = idxToTreeIDNoErrArr.length;
        const numTree = numTreeWithErr + numTreeNoErr;

        const defOpacity = 0.2;
        const highlightedOpacity = 1;
        const errLinkCircleRadius = trkWidth * 1.5;
        const correctTrkColorBe4Err = "#6ef562";
        const correctTrkColorAfterErr = "blue";
        const errLinkClassNamePrefix = "TrackID";
        const errLinkColor = "red";
        const initTracking = function() {
            let classNameOfSelectedErrorLink = undefined;
            let imgIdxBe4SelectErrLink = undefined;
            let imgIdx = 0;
            // functions
            const getImageIndex = () => imgIdx;
            const setCollectionToDefaultOpacity = (htmlCollection) => {
                for (const item of htmlCollection) {
                    item.setAttribute("opacity", defOpacity);
                }
            }
            const setCollectionToHighlightedOpacity = (htmlCollection) => {
                for (const item of htmlCollection) {
                    item.setAttribute("opacity", highlightedOpacity);
                }
            }
            const getCollectionByClassName = (className) => document.getElementsByClassName(className);
            const isAnErrorLinkSelected = () => classNameOfSelectedErrorLink !== undefined;
            const isThisErrorLinkSelected = (className) => classNameOfSelectedErrorLink === className;
            const setSelectedErrorLink = (className) => classNameOfSelectedErrorLink = className;
            const unsetSelectedErrorLink = () => classNameOfSelectedErrorLink = undefined;
            const getSelectedErrorLink = () => classNameOfSelectedErrorLink;
            const updateTracking = (newIdx) => {
                imgIdx = newIdx;
                img.attr("href", `./src/dataset_${datasetIdx}/${imgIdx}.jpg`);
                // set slider
                image_slider.value = newIdx;
                imgSliderLabel.text(`Image Index: ${imgIdx}`);
                // set error links and tracks
                drawErrorLinksAndTracks();
            }
            const removeTrueTrack = () => trueTrkGroup.selectAll("path").remove();
            const reset = () => {
                if (isAnErrorLinkSelected()) {
                    setCollectionToDefaultOpacity(getCollectionByClassName(classNameOfSelectedErrorLink))
                    initLineage.unsetColorOfTreeBranchToUnselected(+classNameOfSelectedErrorLink.split("-")[0]);
                    unsetSelectedErrorLink();
                }
                if (initLineage.isATreeBranchSelected()) {
                    initLineage.unsetColorOfTreeBranchToUnselected(initLineage.getSelectedTreeBranch());
                    initLineage.unsetSelectedTreeBranch();
                    initLineage.unsetClickedOnTreeBranch();
                }
                removeTrueTrack();
                updateTracking(0);
            }
            const showAll = () => {
                reset();
                updateTracking(numImg - 1);
            }
            ////////////////// Selection ////////////////////
            function highlightErrorLinkWhenMouseover() {
                const className = this.getAttribute("class");
                if (!isThisErrorLinkSelected(className)) {
                    setCollectionToHighlightedOpacity(getCollectionByClassName(className))
                    initLineage.setColorOfTreeBranchToSelected(+className.split("-")[0])
                }
            }
            function unhighlightErrorLinkWhenMouseout() {
                const className = this.getAttribute("class");
                if (!isThisErrorLinkSelected(className)) {
                    setCollectionToDefaultOpacity(getCollectionByClassName(className))
                    const trkID = +className.split("-")[0]
                    if (!initLineage.isThisTreeBranchClickedOn(trkID)) initLineage.unsetColorOfTreeBranchToUnselected(trkID)
                }
            }
            function selectErrorLinkWhenClick() {
                const className = this.getAttribute("class");
                const collection = getCollectionByClassName(className);
                const trkID = +className.split("-")[0];
                const secID = +className.split("-")[1];
                if (isThisErrorLinkSelected(className)) {
                    unsetSelectedErrorLink();
                    removeTrueTrack();
                    if (initLineage.isATreeBranchClickedOn()) initLineage.setColorOfTreeBranchToSelected(initLineage.getClickedOnTreeBranch());
                    else initLineage.unsetColorOfTreeBranchToUnselected(trkID);
                    updateTracking(imgIdxBe4SelectErrLink);
                } else {
                    setSelectedErrorLink(className)
                    setCollectionToHighlightedOpacity(collection)
                    imgIdxBe4SelectErrLink = imgIdx;
                    updateTracking(+trkIDToErrImgIdxMap.get(trkID)[secID][1]);
                    initLineage.colorTreeBranch(trkID, secID);
                }
            }
            ////////////////// tracking ////////////////////
            const imgSlider = d3.select("#image_slider")
                .attr("max", numImg - 1);
            const imgSliderLabel = d3.select("#image_slider_label");
            const sVGSideLength = 575;
            // set up the svg that will contain image and tracks
            const imgSVG = d3.select("#tracking_svg")
                .attr("width", sVGSideLength)
                .attr("height", sVGSideLength)
                .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`);
            // image
            const img = d3.select("#image")
                .attr("href", `./src/dataset_${datasetIdx}/${imgIdx}.jpg`)
                .attr("width", resolutionSideLength)
                .attr("height", resolutionSideLength);
            // error track 
            const errLinkGroup = d3.select("#error_link");
            const trueTrkGroup = d3.select("#true_track");
            const drawErrorLinksAndTracks = () => {
                const pathData = [];
                if (initLineage.isATreeBranchSelected()) {
                    for (const key of trkIDToErrImgIdxMap.keys()) {
                        let i = 0;
                        const tempPathData = [];
                        if (key === initLineage.getSelectedTreeBranch()) {
                            for (const value of trkIDToErrImgIdxMap.get(key)) {
                                const temp = value.filter(d => d <= imgIdx);
                                if (temp.length > 0) {
                                    temp.length === 1 ? tempPathData.push([trkIDToErrPathMap.get(key)[i][0]])
                                        : tempPathData.push(trkIDToErrPathMap.get(key)[i])
                                }
                                i++;
                            }
                        }
                        pathData.push(tempPathData);
                    }
                }
                else {
                    for (const key of trkIDToErrImgIdxMap.keys()) {
                        let i = 0;
                        const tempPathData = [];
                        for (const value of trkIDToErrImgIdxMap.get(key)) {
                            const temp = value.filter(d => d <= imgIdx);
                            if (temp.length > 0) {
                                temp.length === 1 ? tempPathData.push([trkIDToErrPathMap.get(key)[i][0]])
                                    : tempPathData.push(trkIDToErrPathMap.get(key)[i])
                            }
                            i++;
                        }
                        pathData.push(tempPathData);
                    }
                }
                for (let i = 0; i < pathData.length; i++) {
                    let group = errLinkGroup.select(`#TrackID${idxToErrTrkIDArr[i]}`);
                    if (group.empty()) group = errLinkGroup.append("g").attr("id", `TrackID${idxToErrTrkIDArr[i]}`);
                    const circles = group.selectAll("circle")
                        .data(pathData[i])
                        .attr("cx", d => d[0] ? d[0][0] : undefined)
                        .attr("cy", d => d[0] ? d[0][1] : undefined)
                        .attr("r", d => d[0] ? errLinkCircleRadius : undefined)
                        .attr("fill", (d, ii) => isAnErrorLinkSelected() && !isThisErrorLinkSelected(`${idxToErrTrkIDArr[i]}-${ii}`)
                            ? "none" : errLinkColor);
                    circles.exit()
                        .attr("r", undefined);
                    circles.enter()
                        .append("circle")
                        .attr("class", (d, ii) => `${idxToErrTrkIDArr[i]}-${ii}`)
                        .attr("cx", d => d[0] ? d[0][0] : undefined)
                        .attr("cy", d => d[0] ? d[0][1] : undefined)
                        .attr("r", d => d[0] ? errLinkCircleRadius : undefined)
                        .attr("opacity", defOpacity)
                        .attr("fill", (d, ii) => isAnErrorLinkSelected() && !isThisErrorLinkSelected(`${idxToErrTrkIDArr[i]}-${ii}`)
                            ? "none" : errLinkColor)
                        .on("mouseover", highlightErrorLinkWhenMouseover)
                        .on("mouseout", unhighlightErrorLinkWhenMouseout)
                        .on("click", selectErrorLinkWhenClick);
                    const paths = group.selectAll("path")
                        .data(pathData[i])
                        .attr("d", d => d3.line()(d))
                        .attr("stroke", (d, ii) => isAnErrorLinkSelected() && !isThisErrorLinkSelected(`${idxToErrTrkIDArr[i]}-${ii}`)
                            ? undefined : errLinkColor);
                    paths.exit()
                        .attr("d", undefined);
                    paths.enter()
                        .append("path")
                        .attr("class", (d, ii) => `${idxToErrTrkIDArr[i]}-${ii}`)
                        .attr("d", d => d3.line()(d))
                        .attr("fill", "none")
                        .attr("stroke", (d, ii) => isAnErrorLinkSelected() && !isThisErrorLinkSelected(`${idxToErrTrkIDArr[i]}-${ii}`)
                            ? undefined : errLinkColor)
                        .attr("opacity", defOpacity)
                        .attr("stroke-width", trkWidth)
                        .on("mouseover", highlightErrorLinkWhenMouseover)
                        .on("mouseout", unhighlightErrorLinkWhenMouseout)
                        .on("click", selectErrorLinkWhenClick);
                }
            
                if (isAnErrorLinkSelected()) {
                    const classInfo = getCollectionByClassName(classNameOfSelectedErrorLink)[0].attributes.class.value.split("-");
                    const tempID = +classInfo[0];
                    const tempTrk = trkDataSortedByTrkID.find(d => d[0].trkID === tempID).filter(d => d.imgIdx <= imgIdx)
                    const tempPathData = [[], []];
                    for (const point of tempTrk) {
                        point.imgIdx <= trkIDToErrImgIdxMap.get(tempID)[classInfo[1]][0] ? tempPathData[0].push([point.x, point.y])
                            : tempPathData[1].push([point.x, point.y])
                    }
                    tempPathData[1].unshift(trkIDToErrPathMap.get(tempID)[classInfo[1]][0]);
                    const tempPath = trueTrkGroup.selectAll("path")
                        .data(tempPathData)
                        .attr("d", d => d3.line()(d))
                    tempPath.exit()
                        .attr("d", undefined)
                    tempPath.enter()
                        .append("path")
                        .attr("d", d => d3.line()(d))
                        .attr("fill", "none")
                        .attr("stroke", (d, i) => i === 0 ? correctTrkColorBe4Err : correctTrkColorAfterErr)
                        .attr("stroke-width", trkWidth)
                }
            }
            return {
                getImageIndex: getImageIndex,
                setCollectionToDefaultOpacity: setCollectionToDefaultOpacity,
                setCollectionToHighlightedOpacity: setCollectionToHighlightedOpacity,
                getCollectionByClassName: getCollectionByClassName,
                isAnErrorLinkSelected: isAnErrorLinkSelected,
                isThisErrorLinkSelected : isThisErrorLinkSelected,
                setSelectedErrorLink: setSelectedErrorLink,
                unsetSelectedErrorLink: unsetSelectedErrorLink,
                getSelectedErrorLink : getSelectedErrorLink,
                updateTracking: updateTracking,
                drawErrorLinksAndTracks: drawErrorLinksAndTracks,
                reset: reset,
                showAll: showAll
            }
        }();

        const TreeClassNamePrefix = "TreeID";
        const corrTreeBranchColor = "#6ef562";
        const lineageSideLength = 575;
        const defNumTreeInAPage = 20;
        const treeHeight = lineageSideLength / defNumTreeInAPage;
        const lineWidth = 3;
        const initLineage = function() {
            let trackIDOfClickedOnTreeBranch = undefined;
            let trackIDOfSelectedTreeBranch = undefined;
            let newTreeHeight;
            let zmK;
            let lineageZm = d3.zoom()
                .on("zoom", d => strechTree(d));
            lineageZm.scaleExtent([1, lineageSideLength / treeHeight / 2]);
            const scaleZmTolineWidth = d3.scaleLinear()
                .domain(lineageZm.scaleExtent());
            const scaleIMGIdxToLineageWidth = d3.scaleLinear()
                .domain([0, numImg - 1])
                .range([0, lineageSideLength]);
            scaleZmTolineWidth.range([lineWidth, Math.log(scaleZmTolineWidth.domain()[1] * lineWidth)]);
            // function
            const isATreeBranchSelected = () => trackIDOfSelectedTreeBranch !== undefined;
            const isATreeBranchClickedOn = () => trackIDOfClickedOnTreeBranch !== undefined;
            const isThisTreeBranchClickedOn = (trkID) => trackIDOfClickedOnTreeBranch === trkID;
            const getErrorLinksByTrackID = (trkID) => document.querySelectorAll(`[class^="${trkID}-"]`);
            const DoesThisTrackContainsError = (trkID) => trkIDToErrImgIdxMap.has(trkID);
            const getNumberOfErrorInThisTrack = (trkID) => trkIDToErrImgIdxMap.get(trkID).length;
            const setColorOfTreeBranchToSelected = (trkID) => {
                treeGroup.select(`#${errLinkClassNamePrefix}${trkID}`).attr("stroke", errLinkColor);
                // remove colored branch
                treeGroup.select(`[stroke="${correctTrkColorAfterErr}"]`).remove();
            }
            const unsetColorOfTreeBranchToUnselected = (trkID) => {
                treeGroup.select(`#${errLinkClassNamePrefix}${trkID}`)
                    .attr("stroke", scaleColorByErrNum(getNumberOfErrorInThisTrack(trkID)));
                // remove colored branch
                treeGroup.select(`[stroke="${correctTrkColorAfterErr}"]`).remove();
            }
            const setSelectedTreeBranch = (trkID) => trackIDOfSelectedTreeBranch = trkID;
            const unsetSelectedTreeBranch = () => trackIDOfSelectedTreeBranch = undefined;
            const getSelectedTreeBranch = () => trackIDOfSelectedTreeBranch;
            const setClickedOnTreeBranch = (trkID) => trackIDOfClickedOnTreeBranch = trkID;
            const unsetClickedOnTreeBranch = () => trackIDOfClickedOnTreeBranch = undefined;
            const getClickedOnTreeBranch = () => trackIDOfClickedOnTreeBranch;
            const colorTreeBranch = (trkID, secID) => {
                const path = treeGroup.select(`#TrackID${trkID}`)
                    .attr("stroke", correctTrkColorBe4Err);
                let pathD = path.attr("d")
                pathD = pathD.split(",");
                pathD[0] = pathD[0].replace("M", "");
                pathD[1] = pathD[1].split("C");
                const startPoint = [[+pathD[0]], [+pathD[1][0]]];
                const endPoint = [[+pathD[pathD.length - 2]], [+pathD[pathD.length - 1]]];
                const tempTrk = trkDataSortedByTrkID.find(d => d[0].trkID === trkID);
                const percent = (trkIDToErrImgIdxMap.get(trkID)[secID][0] - tempTrk[0].imgIdx)
                    / (tempTrk[tempTrk.length - 1].imgIdx - tempTrk[0].imgIdx);
                const midPoint = [[(endPoint[0] - startPoint[0]) * percent + +startPoint[0]],
                [(endPoint[1] - startPoint[1]) * percent + +startPoint[1]]];
                d3.select(path.node().parentNode).append("path")
                    .attr("d", d => d3.line()([midPoint, endPoint]))
                    .attr("fill", "none")
                    .attr("stroke", correctTrkColorAfterErr)
                    .attr("stroke-width", lineWidth)
            }
            ////////////////// Selection ////////////////////
            function selectTreeBranchWhenMouseover() {
                if (!initTracking.isAnErrorLinkSelected()) {
                    const trkID = +this.getAttribute("id").slice(errLinkClassNamePrefix.length);
                    if (DoesThisTrackContainsError(trkID)) {
                        setSelectedTreeBranch(trkID);
                        setColorOfTreeBranchToSelected(trkID);
                        if (isATreeBranchClickedOn() && !isThisTreeBranchClickedOn(trkID)) {
                            unsetColorOfTreeBranchToUnselected(trackIDOfClickedOnTreeBranch);
                        } 
                        initTracking.drawErrorLinksAndTracks();
                    }
                }
            }
            
            function unselectTreeBranchWhenMouseout() {
                if (!initTracking.isAnErrorLinkSelected()) {
                    const trkID = +this.getAttribute("id").slice(errLinkClassNamePrefix.length);
                    if (DoesThisTrackContainsError(trkID)) {
                        setSelectedTreeBranch(trackIDOfClickedOnTreeBranch);
                        if (isATreeBranchClickedOn()) setColorOfTreeBranchToSelected(trackIDOfClickedOnTreeBranch);
                        if (!isThisTreeBranchClickedOn(trkID)) unsetColorOfTreeBranchToUnselected(trkID);
                        initTracking.drawErrorLinksAndTracks();
                    }
                }
            }
            
            function selectTreeBranchWhenClickedOn() {
                const trkID = +this.getAttribute("id").slice(errLinkClassNamePrefix.length);
                if (DoesThisTrackContainsError(trkID) && !initTracking.isAnErrorLinkSelected()) {
                    if (isThisTreeBranchClickedOn(trkID)) {
                        unsetClickedOnTreeBranch();
                        unsetSelectedTreeBranch();
                        unsetColorOfTreeBranchToUnselected(trkID);
                        initTracking.updateTracking(initTracking.getImageIndex());
                    } else {
                        setSelectedTreeBranch(trkID)
                        setClickedOnTreeBranch(trkID);
                        setColorOfTreeBranchToSelected(trkID);
                        // once clicked, jump to the image index that all the error links in the tree branch have occured
                        // if it greater than current image index
                        const tempIdx = +trkIDToErrImgIdxMap.get(trkID)[trkIDToErrImgIdxMap.get(trkID).length - 1][1];
                        initTracking.updateTracking(tempIdx > initTracking.getImageIndex() ? tempIdx : initTracking.getImageIndex());
                    }
                }
            }
            ///////////////// lineage tree zoom ////////////////
            function strechTree(zm) {
                if (zm.transform.k != zmK) {
                    zmK = zm.transform.k;
                    for (let i = 0; i < numTree; i++) {
                        newTreeHeight = zm.transform.k * treeHeight;
                        links[i] = d3.tree().size([newTreeHeight, treeWidthArr[i]])(roots[i]).links();
                        treeGroupArr[i].attr("transform", `translate(0, ${i * newTreeHeight})`);
                        treeGroupArr[i]
                            .selectAll("path")
                            .data(links[i])
                            .attr("d", linkHorizontal)
                            .attr("stroke-width", scaleZmTolineWidth(zm.transform.k));
                    }
                    // zooming the colored tree branch
                    if (initTracking.isAnErrorLinkSelected()) {
                        treeGroup.select(`[stroke="${correctTrkColorAfterErr}"]`).remove();
                        const classInfo = initTracking.getSelectedErrorLink().split("-");
                        colorTreeBranch(+classInfo[0], +classInfo[1]);
                    }
            
                    lineageSVG.attr("height", newTreeHeight * numTree)
                }
            }
            ////////////////// lineage ////////////////////
            const findMaxNumberOfErrorLink = () => {
                let tempArr = [];
                for (const value of trkIDToErrImgIdxMap.values()) {
                    tempArr.push(value.length)
                }
                return Math.max(...tempArr)
            }
            const scaleColorByErrNum = d3.scaleLinear()
                .domain([0, findMaxNumberOfErrorLink()])
                .range(["white", "black"]);
            const lineageSVG = d3.select("#lineage_svg")
                .attr("width", lineageSideLength)
                .attr("height", treeHeight * numTree);
            /*    .call(lineageZm);*/
            const treeGroup = d3.select("#lineage");
            const links = [];
            const roots = [];
            const getLastAppearIdx = (root) => {
                last = root.intvlOfExist[1];
                let temp = [];
                root.children[0].children
                    .forEach(d => {
                        temp.push(getLastAppearIdx(d));
                    })
                last = Math.max(last, ...temp);
                return last;
            }
            // function that customize the tree by changing depth value
            const setRootDepth = (root) => {
                root.depth = inheritanceData.find(d => d.trkID === root.data.trkID).intvlOfExist[0];
                root.children[0].depth = inheritanceData.find(d => d.trkID === root.data.trkID).intvlOfExist[1] + 1;
                root.children[0].children
                    ?.forEach(d => {
                        setRootDepth(d);
                    })
            }
            
            const getInheritanceData = (idxToTrkIDArr) => {
                const retData = [];
                for (let i = 0; i < idxToTrkIDArr.length; i++) {
                    let tempTrk = trkData.filter(d => d.trkID === idxToTrkIDArr[i]);
                    retData[i] = new Object();
                    // ID
                    retData[i].treeID = tempTrk[0].treeID;
                    retData[i].trkID = tempTrk[0].trkID;
                    retData[i].parentTrkID = tempTrk[0].parentTrkID;
                    // it is done to prevent the tree from branching at the very start
                    retData[i].children = [new Object()];
                    retData[i].children[0].children = [];
                    // interval of existence
                    retData[i].intvlOfExist = [tempTrk[0].imgIdx, tempTrk[tempTrk.length - 1].imgIdx];
                    // if tempTrk is a child of other trk, assign tempTrk as a child to its parent track
                    try {
                        if (tempTrk[0].parentTrkID > 0) {
                            let temp = idxToTrkIDArr.indexOf(tempTrk[0].parentTrkID);
                            // check if tempTrk is already a child of its parent track
                            if (!retData[temp].children[0].children.includes(retData[i])) {
                                retData[temp].children[0].children.push(retData[i]);
                            }
                        }
                    } catch {
                        console.log(`The track ${tempTrk[0].trkID} ` + 
                            `has a non-exist parent track of ${tempTrk[0].parentTrkID} ` +
                            `(tree id: ${tempTrk[0].treeID})`);
                    }
                }
                return retData;
            }
            let tempInheritanceData = getInheritanceData(idxToTrkIDWithErrArr);
            const inheritanceData = tempInheritanceData.concat(getInheritanceData(idxToTrkIDNoErrArr));
            // sort the trees by the number of error links each contains
            idxToTreeIDWithErrArr.sort((a, b) => {
                const tree1 = trkData.filter(d => d.treeID === a);
                const trkIDArrOfT1 = [];
                tree1.forEach(d => {
                    if (!trkIDArrOfT1.includes(d.trkID)) trkIDArrOfT1.push(d.trkID);
                })
                const tree2 = trkData.filter(d => d.treeID === b);
                const trkIDArrOfT2 = [];
                tree2.forEach(d => {
                    if (!trkIDArrOfT2.includes(d.trkID)) trkIDArrOfT2.push(d.trkID);
                })
                let val1 = 0;
                trkIDArrOfT1.forEach(d => val1 += DoesThisTrackContainsError(d) ? getNumberOfErrorInThisTrack(d) : 0);
                let val2 = 0;
                trkIDArrOfT2.forEach(d => val2 += DoesThisTrackContainsError(d) ? getNumberOfErrorInThisTrack(d) : 0);
            
                return val2 - val1;
            })
            // set up roots and links
            const treeWidthArr = [];
            for (let i = 0; i < numTreeWithErr; i++) {
                try {
                    // get root track info
                    let tempTrack = inheritanceData.find(d => d.treeID === idxToTreeIDWithErrArr[i] && d.parentTrkID === 0);
                    // set width of the tree to the lineage point of last appear frame
                    treeWidthArr[i] = scaleIMGIdxToLineageWidth(getLastAppearIdx(tempTrack));
                    let treeLayout = d3.tree().size([treeHeight, treeWidthArr[i]]);
                    // set root
                    roots[i] = d3.hierarchy(tempTrack);
                    // customize the tree
                    setRootDepth(roots[i]);
                    // generate link
                    links[i] = treeLayout(roots[i]).links();
                } catch {
                    console.log(`Failed to compute tree ${idxToTreeIDWithErrArr[i]}`)
                }
            }
            for (let i = numTreeWithErr; i < numTree; i++) {
                try {
                    // get root track info
                    let tempTrack = inheritanceData.find(d => d.treeID === idxToTreeIDNoErrArr[i - numTreeWithErr] && d.parentTrkID === 0);
                    // set width of the tree to the lineage point of last appear frame
                    treeWidthArr[i] = scaleIMGIdxToLineageWidth(getLastAppearIdx(tempTrack));
                    let treeLayout = d3.tree().size([treeHeight, treeWidthArr[i]]);
                    // set root
                    roots[i] = d3.hierarchy(tempTrack);
                    // customize the tree
                    setRootDepth(roots[i]);
                    // generate link
                    links[i] = treeLayout(roots[i]).links();
                } catch {
                    console.log(`Failed to compute tree ${idxToTreeIDNoErrArr[i - numTreeWithErr]}`)
                }
            }
            const linkHorizontal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
            const treeGroupArr = [];
            // draw trees using information from links
            const drawTrees = function() {
                for (let i = 0; i < links.length; i++) {
                    try {
                        treeGroupArr[i] = treeGroup.append("g")
                            .attr("id", `TreeID${links[i][0].source.data.treeID}`)
                            .attr("transform", `translate(0, ${i * treeHeight})`);
                        treeGroupArr[i]
                            .selectAll("path")
                            .data(links[i])
                            .enter()
                            .append("path")
                            .attr("id", d => `TrackID${d.source.data.trkID}`)
                            .attr("d", linkHorizontal)
                            .attr("fill", "none")
                            .attr("stroke", d => trkIDToErrImgIdxMap.get(+d.source.data.trkID) ?
                                scaleColorByErrNum(trkIDToErrImgIdxMap.get(+d.source.data.trkID)?.length)
                                : corrTreeBranchColor)
                            .attr("stroke-width", d => trkIDToErrImgIdxMap.get(+d.source.data.trkID) ? lineWidth : 2)
                            .style("stroke-dasharray", d => trkIDToErrImgIdxMap.get(+d.source.data.trkID) ? "none" : ("5,2"))
                            .on("mouseover", selectTreeBranchWhenMouseover)
                            .on("mouseout", unselectTreeBranchWhenMouseout)
                            .on("click", selectTreeBranchWhenClickedOn);
                    } catch {
                        console.log("Failed to build tree " + 
                        `${(i < numTreeWithErr) ? idxToTreeIDWithErrArr[i] : idxToTreeIDNoErrArr[i - numTreeWithErr]}`);
                    }
                }
            }()
            return {
                isATreeBranchSelected: isATreeBranchSelected,
                isATreeBranchClickedOn: isATreeBranchClickedOn,
                isThisTreeBranchClickedOn: isThisTreeBranchClickedOn,
                getErrorLinksByTrackID: getErrorLinksByTrackID,
                DoesThisTrackContainsError: DoesThisTrackContainsError,
                getNumberOfErrorInThisTrack: getNumberOfErrorInThisTrack,
                setColorOfTreeBranchToSelected: setColorOfTreeBranchToSelected,
                unsetColorOfTreeBranchToUnselected: unsetColorOfTreeBranchToUnselected,
                setSelectedTreeBranch: setSelectedTreeBranch,
                unsetSelectedTreeBranch: unsetSelectedTreeBranch,
                getSelectedTreeBranch: getSelectedTreeBranch,
                setClickedOnTreeBranch: setClickedOnTreeBranch,
                unsetClickedOnTreeBranch: unsetClickedOnTreeBranch,
                getClickedOnTreeBranch: getClickedOnTreeBranch,
                colorTreeBranch: colorTreeBranch
            }
        }()
        
        return {
            initTracking: initTracking,
        }
    }
    const initializeAndBuildSingleFOVView = (alg, datasetIdx) => {
        // initialize
        d3.select("#image_slider").remove();
        d3.select("#image_slider_div").append("input")
            .attr("type", "range")
            .attr("min", 0)
            .attr("value", 0)
            .attr("class", "slider")
            .attr("id", "image_slider")
            .attr("oninput", "singleFOV.initTracking.updateTracking(+this.value)");
        image_slider_label.innerHTML = "Image Index: 0";
        d3.select("#tracking_svg")
            .attr("width", null)
            .attr("height", null)
            .attr("viewBox", null);
        d3.select("#image")
            .attr("href", null)
            .attr("width", null)
            .attr("height", null);
        error_link.innerHTML = '';
        true_track.innerHTML = '';
        d3.select("#lineage_svg")
            .attr("width", null)
            .attr("height", null);
        lineage.innerHTML = '';
        // build
        singleFOV = buildSingleFOVView(alg, datasetIdx);
    }
    const buildComparisonView = (datasetIdx, alg1, alg2) => {
        const compareViewData = [];
        compareViewData.push(data.find(d => d[0].datasetIdx === datasetIdx).find(d => d.algorithm === alg1));
        compareViewData.push(data.find(d => d[0].datasetIdx === datasetIdx).find(d => d.algorithm === alg2));
        const sVGSideLength = 450;
        const trkWidth = 20;
        const sameTrkColor = "black";
        const algColorArr = [colorScale(algArr.indexOf(alg1)), colorScale(algArr.indexOf(alg2))]

        const compareDiv = d3.select("#compareDiv");
        compareViewData.forEach((d, i) => {
            const errLinkWindow = compareDiv
                .append("div")
                .attr("id",`div-${d.algorithm}`)
                .attr("class", "box-content rounded-lg p-2 flex justify-center")
                .append("svg")
                .attr("id",`svg-${d.algorithm}`)
                .attr("width", sVGSideLength)
                .attr("height", sVGSideLength)
                .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`)
                .attr("style", "background-color:white")
                .append("g")
                .attr("id", `errorLink-${d.algorithm}`);

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
                    .attr("class", dd => `${d.algorithm}-${dd[0][2]}`)
                    .attr("cx", dd => dd[0][0])
                    .attr("cy", dd => dd[0][1])
                    .attr("r", trkWidth * 1.5)
                    .attr("fill", algColorArr[i]);

                errLinkWindow.selectAll("path")
                    .data(errLinkPathData)
                    .enter()
                    .append("path")
                    .attr("class", dd => `${d.algorithm}-${dd[0][2]}`)
                    .attr("d", dd => d3.line()(dd))
                    .attr("fill", "none")
                    .attr("stroke", algColorArr[i])
                    .attr("stroke-width", trkWidth);
            }
        })
        // color shared error links from two algorithms
        let sameErrNUm = 0;
        d3.select(`#svg-${compareViewData[0].algorithm}`).selectAll("circle").each(function(){
            const circle = this;
            const idx = circle.getAttribute("class").split('-')[1];
            const x = circle.getAttribute('cx')
            const y = circle.getAttribute('cy')
            d3.select(`#svg-${compareViewData[1].algorithm}`).selectAll(`circle.${compareViewData[1].algorithm}-${idx}`).each(function(){
                if (x === this.getAttribute('cx') && y === this.getAttribute('cy')) {
                    circle.setAttribute("fill", sameTrkColor);
                    this.setAttribute("fill", sameTrkColor);
                    sameErrNUm++;
                }
            })
        })   
        d3.select(`#svg-${compareViewData[0].algorithm}`).selectAll("path").each(function(){
            const path = this;
            const idx = path.getAttribute("class").split('-')[1];
            const d = path.getAttribute('d')
            d3.select(`#svg-${compareViewData[1].algorithm}`).selectAll(`path.${compareViewData[1].algorithm}-${idx}`).each(function(){
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
        let LinkNum1 = compareViewData[0].trkData.length - compareViewData[0].idxToTrkIDArr.length;
        for (const value of compareViewData[0].trkIDToErrTrkIDPredMap.values()) errLinkNum1 += value.length - 1;
        let errLinkNum2 = 0;
        let LinkNum2 = compareViewData[1].trkData.length - compareViewData[1].idxToTrkIDArr.length;
        for (const value of compareViewData[1].trkIDToErrTrkIDPredMap.values()) errLinkNum2 += value.length - 1;
        
        let item = compaList.append("li").attr("class", "text-4xl");
        item.append("span")
            .style("color", `${algColorArr[0]}`)
            .text(`${compareViewData[0].algorithm}`);
        item.append("text").text(" vs. ")
        item.append("span")
            .style("color", `${algColorArr[1]}`)
            .text(`${compareViewData[1].algorithm}`);
        item = compaList.append("li").text(`Total links - ${LinkNum1}`);
        item = compaList.append("li").text("Linking errors - ");
        item.append("span")
            .style("color", `${algColorArr[0]}`)
            .text(`${errLinkNum1}`);
        item.append("text").text(", ")
        item.append("span")
            .style("color", `${algColorArr[1]}`)
            .text(`${errLinkNum2}`);
        item = compaList.append("li").text(`Shared linking errors - ${sameErrNUm}`);
        item.append("span")
            .style("color", `${algColorArr[0]}`)
            .text(` (${(sameErrNUm / errLinkNum1 * 100).toFixed(2)}%) `);
        item.append("span")
            .style("color", `${algColorArr[1]}`)
            .text(`(${(sameErrNUm / errLinkNum2 * 100).toFixed(2)}%)`);
        item = compaList.append("li").text("Linking errors (%) - ");
        item.append("span")
            .style("color", `${algColorArr[0]}`)
            .text(`${(errLinkNum1 / LinkNum1 * 100).toFixed(2)}%`);
        item.append("text").text(", ")
        item.append("span")
            .style("color", `${algColorArr[1]}`)
            .text(`${(errLinkNum2 / LinkNum2 * 100).toFixed(2)}%`);
        item.append("text").text(`, ${(sameErrNUm / LinkNum2 * 100).toFixed(2)}%`)

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
            .domain([0, compareViewData[0].numImg - 1]);
        const xAxis = cellCountGraph.append("g")
            .call(d3.axisBottom(xScale));
        const cellCountGraphBotPadding = xAxis.node().getBoundingClientRect().height;
        xAxis.attr("transform", `translate(0, ${graphHeight - cellCountGraphBotPadding})`)
        const yScale = d3.scaleLinear().domain([Math.min(...compareViewData[0].cellCountAcrossIdx),
            Math.max(...compareViewData[0].cellCountAcrossIdx)]);
        const yAxis = cellCountGraph.append("g")
            .call(d3.axisLeft(yScale));
        const cellCountGraphLeftPadding = yAxis.node().getBoundingClientRect().width;
        yAxis.attr("transform", `translate(${cellCountGraphLeftPadding}, 0)`)
        xScale.range([cellCountGraphLeftPadding, graphWidth - cellCountGraphRightPadding]);
        xAxis.call(d3.axisBottom(xScale).ticks(5));
        yScale.range([graphHeight - cellCountGraphBotPadding, tooltipHeight]);
        yAxis.call(d3.axisLeft(yScale));
                                    
        const linearPath = [];
        compareViewData[0].cellCountAcrossIdx.forEach((d, i) => linearPath.push({
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

            let y = compareViewData[0].cellCountAcrossIdx[x];
            tooltipDot
                .attr("cx", xScale(x))
                .attr("cy", yScale(y));
            txt.append("tspan")
                .text(`${y}`)
        }
        compareDiv.node().appendChild(compareDiv.node().childNodes[2]);
    }
    const initializeAndBuildComparisonView = (datasetIdx, alg1, alg2) => {
        // for some reason it have be ' ' instead of '' in order to
        // have comparison panel placing correctly
        compareDiv.innerHTML = ' ';
        buildComparisonView(datasetIdx, alg1, alg2);
    }
    const displaySingleFOVAndHideComparison = () => {
        d3.select('#single_fov_visualizer_display').style('display', null);
        d3.select('#single_fov_compare_display').style('display', 'none');
    }
    const displayComparisonAndHideSingleFOV = () => {
        d3.select('#single_fov_visualizer_display').style('display', 'none');
        d3.select('#single_fov_compare_display').style('display', null);
    }
    return {
        data: data,
        displayOneViewAndHideOthers: displayOneViewAndHideOthers,
        buildOverallView: buildOverallView,
        initializeAndBuildOverallView: initializeAndBuildOverallView,
        buildSingleAlgView: buildSingleAlgView,
        initializeAndBuildSingleAlgView: initializeAndBuildSingleAlgView,
        buildSingleFOVView: buildSingleFOVView,
        initializeAndBuildSingleFOVView: initializeAndBuildSingleFOVView,
        buildComparisonView: buildComparisonView,
        initializeAndBuildComparisonView: initializeAndBuildComparisonView,
        displaySingleFOVAndHideComparison: displaySingleFOVAndHideComparison,
        displayComparisonAndHideSingleFOV: displayComparisonAndHideSingleFOV
    }

}
let initView = initialization(dtArr[0]);
let singleFOV;