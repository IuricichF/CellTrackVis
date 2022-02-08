const allAlgArr = ["cnn", "lap", "trackmate", "trackpy_base", "trackpy_vel"];
const fovNames = ["A_01fld01", "A_01fld07", "A_02fld01","A_02fld03","A_02fld05","A_02fld07","A_02fld08","A_02fld09","A_04fld01","A_04fld10","A_07fld04","A_07fld06"]
const datasetNum = fovNames.length

const dtArr = [4];
const colorScale = d3.scaleOrdinal()
    .domain([...Array(allAlgArr)])
    .range(d3.schemeSet2);
const views = ["index", "overall", "single_alg", "single_fov"];
const resolutionSideLength = 2040;
const trkWidth = 5;
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
                d3.csv(`./src/results/${allAlgArr[algIdx]}_dt${dt}/${fovNames[datasetIdx-1]}.csv`).then(rawData => {
                    // if (algArr.findIndex(d => {console.log(d, allAlgArr[algIdx], -1); return d === allAlgArr[algIdx]}) === -1){
                    //     algArr.push(allAlgArr[algIdx]);
                    // } 
                        
                    tempData[algIdx] = processRawData(datasetIdx, dt, allAlgArr[algIdx], rawData);
                    dataReadCount++;
                    if (dataReadCount === datasetNum * allAlgArr.length) {
                        const initializeAlgSelect = ((id) => {
                            single_alg_alg_select.innerHTML = '';
                            for (const alg of allAlgArr) {
                                d3_single_alg_alg_select.append("option")
                                    .text(`${alg}`);
                            }

                            single_fov_alg_select.innerHTML = '';
                            for (const alg of allAlgArr) {
                                d3_single_fov_alg_select.append("option")
                                    .text(`${alg}`);
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
        
        d3.select("#legend").select("div").remove()

        const div = d3.select("#legend")
                      .append("div")
                      .attr("class", "mt-3 w-full border-t border-gray-700")

        div.append("a")
            .attr("class", "items-center w-full px-2 mt-3")
            .append("span")
            .attr("class", "ml-2 text-sm font-bold")
            .text("Name legend")
            .append("br")



        for(var i=0; i<allAlgArr.length; i++){
            div.append("span")
                .attr("class", "items-center w-full px-20 mt-3")
            .text(allAlgArr[i])
            .style("color", colorScale(allAlgArr[i]))
            .append("br")
        }
        
        
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
                            bg = bg.concat(`linear-gradient(${deg}deg, ${colorScale(allAlgArr[minIdxArr[i]])} ${(i + 1) * pct}%, ` + 
                                `${colorScale(allAlgArr[minIdxArr[i + 1]])} ${(i + 1) * pct}%`);
                            break;
                        }
                        bg = bg.concat(`linear-gradient(${deg}deg, ${colorScale(allAlgArr[minIdxArr[i]])} ${(i + 1) * pct}%, ` +
                            `rgba(0, 0, 0, 0) ${(i + 1) * pct}%), `);
                    }
                } else bg = `${colorScale(allAlgArr[minIdxArr[0]])}`

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
                    .domain(allAlgArr)
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
                            .attr('x', xScale(allAlgArr[ii]))
                            .attr('y', graphHeight - yScaleBars(dd.numErrLink) - graphFooterHeight)
                            .attr("width", xScale.bandwidth())
                            .attr("height", yScaleBars(dd.numErrLink))
                            .attr("class","bars-"+dd.datasetIdx)
                            .attr("fill", colorScale(allAlgArr[ii]))
                    )
                    let text = barChart.append("text")
                        .text(`${dd.numErrLink}`);
                    text.attr('x', xScale(allAlgArr[ii]) + (xScale.bandwidth() - text.node().getBBox().width) / 2)
                        .attr('y', graphHeight - yScaleBars(dd.numErrLink) - graphFooterHeight - tooltipHeight / 6)
                        .attr("fill", colorScale(allAlgArr[ii]));
                    myText.push(text)
                    

                    // text = barChart.append("text")
                    //     .text(allAlgArr[ii]);
                    
                    //     text.attr('x', xScale(allAlgArr[ii]) + (xScale.bandwidth() - text.node().getBBox().width) / 2 )
                    //     .attr('y', function(){
                    //         if(ii%2==0)
                    //             return graphHeight - text.node().getBBox().height / 3 
                    //         else 
                    //         return graphHeight - text.node().getBBox().height / 3 +10})
                    //     text.attr("fill", colorScale(allAlgArr[ii]))
                    //     .style("font-size","12px")
                        // .attr("transform", `translate(${xScale(allAlgArr[ii]) + (xScale.bandwidth() - text.node().getBBox().width) / 2},${graphHeight - text.node().getBBox().height / 3})rotate(-45)`);
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
                        .attr("stroke", (dd, ii) => colorScale(allAlgArr[ii]))
                        .attr("stroke-width", 1);
                    const tooltipDotRadius = 2;
                    const focus = lineChart.append('g')
                    const tooltipDotArr = [];
                    d.forEach((dd, ii) => {
                        tooltipDotArr.push(
                            focus.append("circle")
                                .attr('r', tooltipDotRadius)
                                .attr("opacity", 0)
                                .attr("fill", colorScale(allAlgArr[ii]))
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

            let idxTime = 288

            const div = d3_single_alg_div.append("div")
                .attr("class", "box-content rounded-lg pt-4 pl-2 pr-2 text-base relative bg-gray-900");

            const fovid = div.append("div")
                .text(`${d.datasetIdx}`)
                .attr("id", "name-fov")
                .attr("class", "absolute -inset-x-1/2 -top-2 bg-gray-100 rounded-full " +  
                    "h-12 w-12 flex items-center justify-center m-auto font-sans text-3xl")
                .style("background", colorScale(alg))

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
                .append("text").text(` ${numlinkErr}`).style("color", colorScale(alg));
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

            const xScale = d3.scaleLinear()
                .domain([0, d.numImg - 1])
                .range([leftPadding, graphWidth - leftPadding]);
            
            
            const yScale = d3.scaleLinear()
                            .domain(d3.extent([...d.cellCountAcrossIdx]))
                            .range([graphHeight - bottomPadding, 2]);
            
            //drawing the errors
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
            const errLinkPathTime = [];
            for (const value of d.trkIDToErrPathMap.values()) {
                for (const point of value) {
                    errLinkPathData.push(point);
                }
            }
            for (const value of d.trkIDToErrImgIdxMap.values()) {
                for (const point of value) {
                    errLinkPathTime.push(point);
                }
            }

            var myPoints;
            var myLines;

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
                myPoints = errLinkWindow.selectAll("circle")
                    .data(errLinkPathData)
                    .enter()
                    .append("circle")
                    .attr("cx", d => d[0][0])
                    .attr("cy", d => d[0][1])
                    .attr("r", trkWidth * 1.5)
                    .attr("opacity", (d,i) => {
                        if(errLinkPathTime[i][0] < idxTime)
                            return 1
                        return 0; 
                    })
                    .attr("fill", colorScale(alg));

                myLines = errLinkWindow.selectAll("path")
                    .data(errLinkPathData)
                    .enter()
                    .append("path")
                    .attr("d", d => d3.line()(d))
                    .attr("fill", "none")
                    .attr("stroke", colorScale(alg))
                    .attr("opacity", (d,i) => {
                        if(errLinkPathTime[i][0] < idxTime)
                            return 1
                        return 0; 
                    })
                    .attr("stroke-width", trkWidth);
            }

            function updateErrors(){
                myPoints.attr("opacity", (d,i) => {
                    if(errLinkPathTime[i][0] < idxTime)
                        return 1
                    return 0; 
                })

                myLines.attr("opacity", (d,i) => {
                    if(errLinkPathTime[i][0] < idxTime)
                        return 1
                    return 0; 
                })
            }
                                        
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
                .attr("stroke", colorScale(alg))
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
                .attr('fill', colorScale(alg));

            const tooltipLine = cellCountGraph. append("line")
                .attr('opacity', 0)
                .attr('x1', leftPadding)
                .attr('y1', 0)
                .attr('x2', graphWidth - leftPadding)
                .attr('y2', 0)
                .attr('stroke', colorScale(alg));
            
            
            function showDetailWhenMousemove() {
                let x = xScale.invert(d3.pointer(event, this)[0]);
                x = (x % 1 > 0.5) ? Math.trunc(x) + 1 : Math.trunc(x)
                if (x < 0) x = 0;
                if (x > xScale.domain()[1]) x = xScale.domain()[1];
                
                idxTime = x
                
                let y = d.cellCountAcrossIdx[x];
                tooltipDot
                    .attr('opacity', 1)
                    .attr("cx", xScale(x))
                    .attr("cy", yScale(y));

                tooltipLine
                    .attr('opacity', 0.3)
                    .attr('y1', yScale(y))
                    .attr('y2', yScale(y))

                updateErrors()
            }

            function resetLine() {
                
                tooltipDot
                    .attr('opacity', 0)

                tooltipLine
                    .attr('opacity', 0)

                idxTime = 288
                updateErrors()
            }



            
            
        })
    }
    const initializeAndBuildSingleAlgView = (alg) => {
        single_alg_div.innerHTML = '';
        buildSingleAlgView(alg);
    }


    //SINGLE FOV VIEW
    const buildSingleFOVView = (alg, datasetIdx) => {
        const singleFOVViewData = data.find(d => d[0].datasetIdx === datasetIdx).find(d => d.algorithm === alg)
        const numImg = singleFOVViewData.numImg;
        const trkIDToErrPathMap = singleFOVViewData.trkIDToErrPathMap;
        const trkIDToErrImgIdxMap = singleFOVViewData.trkIDToErrImgIdxMap;

        var trkData = {}
        var nErrors = 0
        for(const key of trkIDToErrPathMap.keys()){
            trkData[key] = {}
            trkData[key]["ErrCoords"] = d3.map(trkIDToErrPathMap.get(key), d => d.flat())
            trkData[key]["ErrTime"] = trkIDToErrImgIdxMap.get(key)
            nErrors += trkData[key]["ErrCoords"].length
        }
    
        var nTracksWithError = Object.keys(trkData).length


        d3.select("#infoFOV").text(`Field of View name - ${fovNames[datasetIdx]}`)
        d3.select("#infoTrack").text(`Tracks with errors - ${nTracksWithError}`)
        d3.select("#infoErr").text(`Total number of errors - ${nErrors}`)

        const colorTrack = "black";
        const colorError = colorScale(alg)
        const errorOpacity = 0.5;
        const errLinkCircleRadius = 10;

        var selectedTrack = -1
        var selectedId = -1

        var imgIdx = numImg-1
        const imgSlider = d3.select("#image_slider")
        imgSlider.attr("max", numImg - 1);

        const imgSliderLabel = d3.select("#image_slider_label");    
        image_slider.value = imgIdx;
        imgSliderLabel.text(`${imgIdx}`);

        const size = 575;
        const wsize = 720;
        const buff = 55;
        //Draw errors on top of the image
        // set up the svg that will contain image and tracks
        const imgSVG = d3.select("#tracking_svg")
            .attr("width", size)
            .attr("height", size)
            .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`);

        
        // image
        const img = d3.select("#image")
            .attr("href", `./src/${fovNames[datasetIdx-1]}/${imgIdx}.jpg`)
            .attr("width", resolutionSideLength)
            .attr("height", resolutionSideLength);


        const xScale = d3.scaleBand()
            .domain([...Array(numImg).keys()])
            .range([0,wsize-buff])
            .padding(0.1)



        const hsize = nTracksWithError*parseInt(xScale.bandwidth()*3)+10
        console.log(nTracksWithError)
        console.log(xScale.bandwidth())
        const plotSVG = d3.select("#errors_svg")
                        .attr("width", wsize)
                        .attr("height", hsize)

    
        const yScale = d3.scaleBand()
                .domain(Object.keys(trkData))
                .range([hsize-20,0])
                .padding(0.1)


        plotSVG.selectAll("rect").remove()
        plotSVG.selectAll("line").remove()
        plotSVG.selectAll("path").remove()
        plotSVG.selectAll("circle").remove()


        function updateBoxPlot(){

            plotSVG.selectAll(`.Tracks`).attr('opacity', '0')
            plotSVG.selectAll(`#labelTrack`).remove()
            
            plotSVG.selectAll(`#labelTime`).remove()
            plotSVG.append("g")
                .append("text")
                .attr("id", "labelTime")
                .attr("x", xScale(imgIdx))
                .attr("y", hsize-10)
                .style("fill", "white")
                .attr("font-size", 10)
                .attr("font-family", "sans-serif")
                .text(`Time ${imgIdx}`);
            
            if(selectedTrack != -1){
                plotSVG.select(`#Track-${selectedTrack}`).attr('opacity', '0.3')
                
                plotSVG.append("g")
                        .append("text")
                        .attr("id", "labelTrack")
                        .attr("x", wsize-buff)
                        .attr("y", yScale(selectedTrack))
                        .style("fill", "white")
                        .attr("font-size", 10)
                        .attr("font-family", "sans-serif")
                        .text(`Track ${selectedTrack}`);
            }
                

            plotSVG.selectAll(`.Errors`).attr('stroke-width', '0')
            plotSVG.selectAll(`.Errors`).attr('fill', colorError)
            if(selectedId != -1){
                plotSVG.select(`#Err_${selectedTrack}_${selectedId}`).attr('fill', 'red')
            }

        }

        function updateTracksOnImage(){
            // //update errors in image
            imgSVG.selectAll("circle").remove()
            imgSVG.selectAll("line").remove()
            imgSVG.selectAll("path").remove()

            if(selectedTrack == -1)
                return 

            if(selectedId == -1){
                imgSVG.attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`);
                
                var circles = imgSVG.selectAll("circle")
                    .data(trkData[selectedTrack]["ErrCoords"])
                    .attr("cx", d => d[0])
                    .attr("cy", d => d[1])

                    circles.enter()
                        .append("circle")
                        .attr("cx", d => d[0])
                        .attr("cy", d => d[1])
                        .attr("r", d => errLinkCircleRadius)
                        .attr("fill", d => colorError);
                    
                    circles.exit()
                        .remove()
                    
                    var paths = imgSVG.selectAll("line")
                        .data(trkData[selectedTrack]["ErrCoords"])
                        .attr("x1", d => d[0])
                        .attr("y1", d => d[1])
                        .attr("x2", d => d[2])
                        .attr("y2", d => d[3])

                    paths.enter()
                            .append("line")
                            .attr("x1", d => d[0])
                            .attr("y1", d => d[1])
                            .attr("x2", d => d[2])
                            .attr("y2", d => d[3])
                            .attr("stroke", colorError)
                            .attr("stroke-width", trkWidth)
                    
                    paths.exit()
                            .remove();
            }
            else{
                var coords = trkData[selectedTrack]["ErrCoords"].filter((d,i)=> i == selectedId)[0]
                var shift = 300
                imgSVG.attr("viewBox", `${coords[0]-shift} ${coords[1]-shift} 500 500`);

                const tempTrk = singleFOVViewData.trkDataSortedByTrkID.find(d => d[0].trkID === selectedTrack).filter(d => d.imgIdx <= imgIdx);
                const tempPathData = [[], []];
                // the loop goes through every point of the track to determined if it is before error link happen or after
                for (const point of tempTrk) {
                    point.imgIdx <= trkData[selectedTrack]["ErrTime"][selectedId][0] ? tempPathData[0].push([point.x, point.y]) // before
                        : tempPathData[1].push([point.x, point.y]) // after
                }
                tempPathData[1].unshift(tempPathData[0][tempPathData[0].length - 1]);

                var tempPath = imgSVG.selectAll("#thePath")
                    .data(tempPathData)
                    .attr("d", d => d3.line()(d))
                    
                tempPath.exit()
                    .attr("d", undefined)
                tempPath.enter()
                    .append("path")
                    .attr("id", "thePath")
                    .attr("d", d => d3.line()(d))
                    .attr("fill", "none")
                    .attr("stroke", "black")
                    .style("stroke-dasharray", (d, i) => i === 0 ? ("14, 10") : "none")
                    .attr("stroke-width", trkWidth)

                //draw error link
                var circles = imgSVG.selectAll("circle")
                    .data(trkData[selectedTrack]["ErrCoords"].filter((d,i)=> i == selectedId))
                    .attr("cx", d => d[0])
                    .attr("cy", d => d[1])

                circles.enter()
                    .append("circle")
                    .attr("cx", d => d[0])
                    .attr("cy", d => d[1])
                    .attr("r", d => errLinkCircleRadius)
                    .attr("fill", d => colorError);

                circles.exit()
                    .remove()


                var paths = imgSVG.selectAll("line")
                    .data(trkData[selectedTrack]["ErrCoords"].filter((d,i)=> i == selectedId))
                    .attr("x1", d => d[0])
                    .attr("y1", d => d[1])
                    .attr("x2", d => d[2])
                    .attr("y2", d => d[3])

                paths.enter()
                        .append("line")
                        .attr("x1", d => d[0])
                        .attr("y1", d => d[1])
                        .attr("x2", d => d[2])
                        .attr("y2", d => d[3])
                        .attr("stroke", colorError)
                        .attr("stroke-width", trkWidth)
                
                paths.exit()
                        .remove();

            }
            
        }


        plotSVG.append("line")
                .attr("id", "indexRef")
                .attr("x1", d => xScale(imgIdx))
                .attr("y1", d => 0)
                .attr("x2", d => xScale(imgIdx))
                .attr("y2", d => hsize)
                .attr("stroke", d => colorError)
                .attr("opacity", 0.3)
                .attr("stroke-width", 1);


        plotSVG.append("g").selectAll("rect")
            .data(Object.keys(trkData))
            .enter()
            .append("rect")
            .attr("class", "Tracks")
            .attr("id", d => `Track-${d}`)
            .attr("x", d => 0)
            .attr("y", d => yScale(d))
            .attr("width", wsize-buff)
            .attr("height", yScale.bandwidth())
            .attr("opacity", 0)
            .attr("fill", colorError)
            .on("mouseover", function (event, d) {d3.select(this).attr('opacity', '0.3')})
            .on("mouseout", function (event, d) {if(selectedTrack!=d) d3.select(this).attr('opacity', '0')})
            .on("click", function (event, track) {
                            
                if(selectedTrack == +track)
                    selectedTrack = -1
                else selectedTrack = +track

                selectedId = -1

                updateBoxPlot()
                updateTracksOnImage()

            })

    
        const container = plotSVG.append("g")
        for (const key of Object.keys(trkData)) {
            
            var gPlot = container.append("g").attr("id",`plotErr-${key}`)
            const boxes = gPlot.selectAll("rect")
                                .data(trkData[key]["ErrTime"])
                                .enter()
                                .append("rect")
                                .attr("class", "Errors")
                                .attr("id",(d,i) => `Err_${key}_${i}`)
                                .attr("x", d => xScale(d[0]))
                                .attr("y", d => yScale(key))
                                .attr("width", xScale.bandwidth()*3)
                                .attr("height", yScale.bandwidth())
                                .attr('stroke', 'red')
                                .attr('stroke-width', 0)
                                .attr("fill", colorError)
                                .on("mouseover", function (event, d) {d3.select(this).attr('stroke-width', 1)})
                                .on("mouseout", function (event, d) {d3.select(this).attr('stroke-width', 0)})
                                .on("click", function (event, time) {
                                    var idStr = this.id.split("_")
                                    var track = +idStr[1]
                                    var id = +idStr[2]

                                    if(selectedId == id && track == selectedTrack)
                                        selectedId = -1
                                    else selectedId = id

                                    if(selectedTrack != track)
                                        selectedTrack = track

                                    updateTracking(time[1])
                                    updateBoxPlot()

                                })
        }


        const updateTracking = (newIdx) => {
            imgIdx = newIdx;
            img.attr("href", `./src/${fovNames[datasetIdx-1]}/${imgIdx}.jpg`);
            
            // set slider
            image_slider.value = newIdx;
            imgSliderLabel.text(`${imgIdx}`);

            plotSVG.select("line")
                    .attr("x1", d => xScale(imgIdx))
                    .attr("x2", d => xScale(imgIdx))

            updateTracksOnImage()

            plotSVG.selectAll(`#labelTime`).remove()
            plotSVG.append("g")
                .append("text")
                .attr("id", "labelTime")
                .attr("x", xScale(imgIdx))
                .attr("y", hsize-10)
                .style("fill", "white")
                .attr("font-size", 10)
                .attr("font-family", "sans-serif")
                .text(`Time ${imgIdx}`);
                
        }

        return {
            
            updateTracking: updateTracking,
        
        }
    }


    const initializeAndBuildSingleFOVView = (alg, datasetIdx) => {

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

        singleFOV = buildSingleFOVView(alg, datasetIdx);
    }
    const displaySingleFOVAndHideComparison = () => {
        d3.select('#single_fov_visualizer_display').style('display', null);
        d3.select('#single_fov_compare_display').style('display', 'none');
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
        displaySingleFOVAndHideComparison: displaySingleFOVAndHideComparison
    }

}
let initView = initialization(dtArr[0]);
let singleFOV;