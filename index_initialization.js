const datasetNum = 12;
const dtArr = [1, 2, 4, 8, 12, 16]
const algArr = ["lap", "rnn"]
const resolutionSideLength = 2040;
const sVGSideLength = 300;
const errTrkColor = "red";
const trkWidth = 10;
const initView1 = function() {
    localStorage.clear();
    let datasetArr;
    var currDt = dtArr[0];
    var currAlg = algArr[0];
    const getDt = () => currDt;
    const getAlg = () => currAlg;
    const initToDt = (dt, alg) => {
        d3.select("#view1").selectAll("*").remove();
        datasetArr = [];
        currDt = dt;
        currAlg = alg;
        const processRawData = (datasetIdx, dt, rawData) => {
            let trkData = [];
            let trkDataSortedByTrkID = [];
            let idxToTrkIDArr = [];
            let idxToTreeIDArr = [];
            let idxToTrkIDPredArr = [];
            let cellCountAcrossIdx = [];
            let trkIDToErrTrkIDPredMap = new Map();
            let trkIDToErrPathMap = new Map();
            let trkIDToErrImgIdxMap = new Map();
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
            return {
                datasetIdx: datasetIdx,
                numImg: numImg,
                trkData: trkData,
                idxToTrkIDArr: idxToTrkIDArr,
                idxToTreeIDArr: idxToTreeIDArr,
                trkDataSortedByTrkID: trkDataSortedByTrkID,
                trkIDToErrTrkIDPredMap: trkIDToErrTrkIDPredMap,
                trkIDToErrPathMap: trkIDToErrPathMap,
                trkIDToErrImgIdxMap: trkIDToErrImgIdxMap,
                cellCountAcrossIdx: cellCountAcrossIdx
            }
        }
        for (let datasetIdx = 1; datasetIdx <= datasetNum; datasetIdx++) {
            d3.csv(`/DataVis/src/dataset_${datasetIdx}/res_${alg}_real_dt${currDt}.csv`).then(rawData => {
                datasetArr.push(processRawData(datasetIdx, currDt, rawData));
                if (datasetArr.length === datasetNum) {
                    datasetArr.sort((a, b) => b.trkIDToErrTrkIDPredMap.size - a.trkIDToErrTrkIDPredMap.size);
                    datasetArr.forEach(d => {
                        const div = d3.selectAll("#view1").append("div")
                            .attr("class", "box-content bg-gray-200 rounded-lg p-2");
                        const fieldOfView = div.append("div")
                            .attr("class", "flex justify-center");
                        const errLinkWindow = fieldOfView.append("a")
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
                            .attr("id", `errorLink${d.datasetIdx}`);
                        const ul = div.append("div")
                            .attr("class", "box-content p-2 self-center")
                            .append("ul")
                            .attr("class", "list-dic");

                        let numlinkErr = 0;
                        for (const value of d.trkIDToErrTrkIDPredMap.values()) numlinkErr += value.length - 1;
                        let numlink = d.trkData.length - d.idxToTrkIDArr.length;
                        ul.append("li").text(`Field of view - #${d.datasetIdx}`)
                        ul.append("li").text(`Linking errors - ${numlinkErr}`)
                        ul.append("li").text(`Linking errors (%) - ${(numlinkErr / numlink * 100).toFixed(2)}%`)
                        ul.append("li").text(`Total links - ${numlink}`)
                        ul.append("li").text(`Cell count (0-${d.numImg - 1}) 
                            - ${d.cellCountAcrossIdx[0]}-${d.cellCountAcrossIdx[d.cellCountAcrossIdx.length - 1]}`)
                            
                        const graphHeight = 100;
                        const graphWidth = 200;
                        const spaceBtwnTextAndTooltipBoundary = 6;
                        const tooltipDotRadius = 2;
                        const disBtwnDotAndTooltip = 10;
                        const tooltipHeight = graphHeight / 3.4 + spaceBtwnTextAndTooltipBoundary;
                        const tooltipWidth = graphWidth / 1.8;
                        const cellCountGraph = ul.append("svg")
                            .attr("width", graphWidth)
                            .attr("height", graphHeight + tooltipHeight)
                            .attr("viewBox", `0 0 ${graphWidth} ${graphHeight}`);
                        const xScale = d3.scaleLinear()
                            .domain([0, d.numImg - 1])
                            .range([0, graphWidth])
                        const yScale = d3.scaleLinear()
                            .domain([Math.min(...d.cellCountAcrossIdx), Math.max(...d.cellCountAcrossIdx)])
                            .range([graphHeight, 0])
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

                        const focus = cellCountGraph.append("g")
                            .attr("class", "focus")
                            .style("display", "none");
                        const tooltipGroup = focus.append("g")
                            .attr("class", "tooltipGroup")
                        focus.append("circle")
                            .attr("r", tooltipDotRadius);
                        tooltipGroup.append("rect")
                            .attr("class", "tooltip")
                            .attr("width", tooltipWidth)
                            .attr("height", tooltipHeight)
                            .attr("x", disBtwnDotAndTooltip)
                            .attr("y", 0)
                            .attr("fill", "white")
                        tooltipGroup.append("text")
                            .attr("x", disBtwnDotAndTooltip)
                            .attr("y", (tooltipHeight - spaceBtwnTextAndTooltipBoundary) / 2)
                            .text("Index:");
                        tooltipGroup.append("text")
                            .attr("x", disBtwnDotAndTooltip)
                            .attr("y", tooltipHeight - spaceBtwnTextAndTooltipBoundary / 2)
                            .text("Cell count:");
                        const tooltipDataXPos = tooltipWidth * 0.79;
                        tooltipGroup.append("text")
                            .attr("class", "tooltip-index")
                            .attr("x", tooltipDataXPos)
                            .attr("y", (tooltipHeight - spaceBtwnTextAndTooltipBoundary) / 2)
                        tooltipGroup.append("text")
                            .attr("class", "tooltip-count")
                            .attr("x", tooltipDataXPos)
                            .attr("y", tooltipHeight - spaceBtwnTextAndTooltipBoundary / 2)
                        cellCountGraph.append("rect")
                            .attr("class", `overlay-${d.datasetIdx}`)
                            .attr("width", graphWidth)
                            .attr("height", graphHeight + tooltipHeight)
                            .attr("opacity", 0)
                            .on("mouseover", () => focus.style("display", null))
                            .on("mouseout", () => focus.style("display", "none"))
                            .on("mousemove", showDetailWhenMousemove);
                        function showDetailWhenMousemove() {
                            let x = xScale.invert(d3.pointer(event, this)[0]);
                            x = (x % 1 > 0.5) ? Math.trunc(x) + 1 : Math.trunc(x)
                            let transX = xScale(x);
                            let transY = yScale(d.cellCountAcrossIdx[x]);
                            tooltipGroup.select(".tooltip-index").text(`${x}`);
                            tooltipGroup.select(".tooltip-count").text(`${d.cellCountAcrossIdx[x]}`);
                            focus.attr("transform", `translate(${transX}, ${transY})`);
                            if (transY + tooltipHeight > graphHeight) {
                                if (transX + tooltipWidth + disBtwnDotAndTooltip > graphWidth) {
                                    tooltipGroup.attr("transform", `translate(${graphWidth 
                                        - (transX + tooltipWidth + disBtwnDotAndTooltip)}, ${-tooltipHeight})`);
                                }else tooltipGroup.attr("transform", `translate(0, ${-tooltipHeight})`);
                            }
                            else if (transX + tooltipWidth + disBtwnDotAndTooltip > graphWidth) {
                                tooltipGroup.attr("transform", `translate(${graphWidth 
                                    - (transX + tooltipWidth + disBtwnDotAndTooltip)}, ${disBtwnDotAndTooltip})`);
                            }
                            else tooltipGroup.attr("transform", undefined);
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
                                .attr("fill", errTrkColor);
                
                            errLinkWindow.selectAll("path")
                                .data(errLinkPathData)
                                .enter()
                                .append("path")
                                .attr("d", d => d3.line()(d))
                                .attr("fill", "none")
                                .attr("stroke", errTrkColor)
                                .attr("stroke-width", trkWidth);
                        }
                        function transferDataToView2() {
                            const offset = 3;
                            localStorage.setItem("resolutionSideLength", resolutionSideLength);
                            localStorage.setItem("datasetIdx", +this.getAttribute("id").slice(offset));
                            localStorage.setItem("dt", currDt);
                            localStorage.setItem("processRawData", processRawData.toString());
                            localStorage.setItem("algArr", JSON.stringify(algArr));
                        }
                    })
                }
            })
        }
    }
    initToDt(currDt, currAlg)

    return {
        initToDt: initToDt,
        getDt: getDt,
        getAlg: getAlg,
        datasetArr: datasetArr
    }
}()
