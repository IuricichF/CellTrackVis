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
            if (data.length === algArr.length) {
                data.forEach((d, i) => {
                    const errLinkWindow = d3.select("#view2Div")
                    .append("div")
                    .attr("id",`div-${algArr[i]}`)
                    .append("svg")
                    .attr("id",`svg-${algArr[i]}`)
                    .attr("width", sVGSideLength)
                    .attr("height", sVGSideLength)
                    .attr("viewBox", `0 0 ${resolutionSideLength} ${resolutionSideLength}`)
                    .append("g")
                    .attr("id", `errorLink-${algArr[i]}`);
                    
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
                    const idx = +circle.getAttribute("class").split('-')[1];
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
                    const idx = +path.getAttribute("class").split('-')[1];
                    const d = path.getAttribute('d')
                    d3.select(`#svg-${algArr[1]}`).selectAll(`path.${algArr[1]}-${idx}`).each(function(){
                        if (d === this.getAttribute('d')) {
                            path.setAttribute("stroke", errTrkColorArr[2]);
                            this.setAttribute("stroke", errTrkColorArr[2]);
                        }
                    })
                })            
            }
        })
    }
    return { 
        data: data
    }
}()
