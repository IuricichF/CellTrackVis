////////////////// highlinght ////////////////////
var htmlArr;
var selHtmlArr;
const TRK_FILL = "red";
const SEL_TRK_FILL = "blue";
const NHT_TRK_DEF_OPACITY = 0.2;
const HT_TRK_DEF_OPACITY = 1;
function hightlightTrk() {
    const MOUSE_OVER_TRK_ID = this.getAttribute("class");
    if (MOUSE_OVER_TRK_ID.slice(7) != "undefined") {
        htmlArr = document.getElementsByClassName(MOUSE_OVER_TRK_ID);
        for (let item of htmlArr) {
            item.attributes.opacity.value = HT_TRK_DEF_OPACITY;
        }
    }
}
function unhightlightTrk() {
    if (!selHtmlArr.includes(htmlArr)) {
        for (let item of htmlArr) {
            item.attributes.opacity.value = NHT_TRK_DEF_OPACITY;
        }
    }
}
function selectTrk() {
    if (selHtmlArr.includes(htmlArr)) {
        selHtmlArr.splice(selHtmlArr.indexOf(htmlArr), 1);
        for (let item of htmlArr) {
            item.attributes.opacity.value = HT_TRK_DEF_OPACITY;
            if (item.localName === "circle") item.attributes.fill.value = TRK_FILL;
            else if (item.localName === "path") item.attributes.stroke.value = TRK_FILL;
        }
    } else {
        selHtmlArr.push(htmlArr);
        for (let item of htmlArr) {
            if (item.localName === "circle") item.attributes.fill.value = SEL_TRK_FILL;
            else if (item.localName === "path") item.attributes.stroke.value = SEL_TRK_FILL;
        }
    }
}
function selectNCenterTrk() {
    if (selHtmlArr.includes(htmlArr)) {
        selHtmlArr.splice(selHtmlArr.indexOf(htmlArr), 1);
        for (let item of htmlArr) {
            item.attributes.opacity.value = HT_TRK_DEF_OPACITY;
            if (item.localName === "circle") item.attributes.fill.value = TRK_FILL;
            else if (item.localName === "path") item.attributes.stroke.value = TRK_FILL;
        }
    } else {
        // center the selected track
        let temp = htmlArr[2].parentElement.attributes.transform.value;
        let xfm = +temp.slice(13, temp.length - 1);
        temp = htmlArr[2].parentElement.parentElement.parentElement.attributes.transform.value;
        xfm += +temp.slice(13, temp.length - 1);
        TREE_GRP.attr("transform", `translate(0, ${(LINEAGE_H - newTreeH) / 2 - xfm})`);
        // blue the selected track
        selHtmlArr.push(htmlArr);
        for (let item of htmlArr) {
            if (item.localName === "circle") item.attributes.fill.value = SEL_TRK_FILL;
            else if (item.localName === "path") item.attributes.stroke.value = SEL_TRK_FILL;
        }
    }

}
////////////////// image ////////////////////
// image index from 0 to number of images - 1
var imgIdx;
// image info
const imgResSideLength = 2040;
const viewBoxSideLength = 590;
// set up the svg that will contain image and tracks
const IMG_SVG = d3.select(".rend_image_track")
    .attr("width", viewBoxSideLength)
    .attr("height", viewBoxSideLength)
    .attr("viewBox", `0 0 ${imgResSideLength} ${imgResSideLength}`);
// image
const IMG = d3.select("#image")
    .attr("width", imgResSideLength)
    .attr("height", imgResSideLength)
// update the image
function updateImage(newIdx) {
    imgIdx = newIdx;
    // hardcoding the image file name for now, might change in future
    IMG.attr("href", `/DataVis/src/dataset_${datasetIdx}/${imgIdx}.png`);
    IMG_SLD_TXT.text(`Image Index: ${IMG_SLD_EL.value}`);
    // draw tracks on the image
    drawTrack();
}
////////////////// track ////////////////////
// track info
const TRK_W = 8;
var numTrk;
// track group
const trkGroup = d3.select("#trackGroup");
// function that draws tracks on image
function drawTrack() {
    // populate track path data
    const trkData_TO_IDX = trkData.filter(d => d.imgIdx <= imgIdx);
    var trkPath = [];
    trkData_TO_IDX
        .forEach(d => {
            let temp = idxToTrkIDArr.indexOf(d.trkID)
            if (trkPath[temp] === undefined) {
                trkPath[temp] = [[]];
                trkPath[temp][1] = d.trkID;
            }
            trkPath[temp][0].push([d.x, d.y]);

        })
    // get rid of underfined elements
    trkPath = trkPath.filter(d => d !== undefined);
    // build starting points of tracks
    // update
    const START_PTS = trkGroup.selectAll("circle")
        .data(trkPath)
        .attr("cx", d => d[0][0][0])
        .attr("cy", d => d[0][0][1])
        .attr("class", d => `trkID: ${d[1]}`);
    // exit
    START_PTS
        .exit()
        .attr("cx", null)
        .attr("cy", null);
    // enter
    START_PTS.enter()
        .append("circle")
        .attr("cx", d => d[0][0][0])
        .attr("cy", d => d[0][0][1])
        .attr("class", d => `trkID: ${d[1]}`)
        .attr("r", TRK_W)
        .attr('fill', TRK_FILL)
        .attr("opacity", NHT_TRK_DEF_OPACITY)
        .on("mouseover", hightlightTrk)
        .on("mouseout", unhightlightTrk)
        .on("click", selectNCenterTrk);

    // build tracks
    // update
    const TRKS = trkGroup.selectAll("path")
        .data(trkPath)
        .attr("d", d => d3.line()(d[0]))
        .attr("class", d => `trkID: ${d[1]}`);
    // exit
    TRKS
        .exit()
        .attr("d", null);
    // enter
    TRKS.enter()
        .append("path")
        .attr("d", d => d3.line()(d[0]))
        .attr("class", d => `trkID: ${d[1]}`)
        .attr("fill", "none")
        .attr("stroke", TRK_FILL)
        .attr("stroke-width", TRK_W)
        .attr("opacity", NHT_TRK_DEF_OPACITY)
        .on("mouseover", hightlightTrk)
        .on("mouseout", unhightlightTrk)
        .on("click", selectNCenterTrk);
}
