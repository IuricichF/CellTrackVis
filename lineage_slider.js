// slider group
const lineagesliderGroup = svg.append("g")
    .attr("id", "lineageslider")
    .attr("transform", `translate(${LINEAGE_WIDTH * 2.01 + 100}, ${(VIEW_BOX_HEIGHT - LINEAGE_WIDTH) / 2})`);
// slide container
lineagesliderGroup.append("rect")
    .attr("id", "lineageSliderContainer")
    .attr("stre", "black")
    .attr("fill", "#a19f99")
    .attr("width",LINEAGE_WIDTH / 10)
    .attr("height", LINEAGE_WIDTH);
// draggable control object
var lineageDraggableObjHeight;
var lineageDraggableObj = lineagesliderGroup.append("rect")
    .attr("id", "lineageDraggableObj")
    .attr("stroke", "black")
    .attr("fill", "white")
    .attr("width", LINEAGE_WIDTH / 10);
let lineageIsMoving = false;
let y = 0;
const lineageDraggableObjElement = document.getElementById("lineageDraggableObj");
const lineageSliderContainer = document.getElementById("lineageSliderContainer");
lineageSliderContainer.addEventListener("mousedown", e => {
    y = e.y;
    lineageIsMovin= true;
    moveLineageSlider(y);
});
lineageDraggableObjElement.addEventListener("mousedown", e => {
    y = e.y;
    lineageIsMoving = true;
    moveLineageSlider(y);
});
document.getElementsByClassName("divContainer")[0].addEventListener("mousemove", e => {
    if (lineageIsMoving === true) {
        y = e.y
        moveLineageSlider(y);
    }
});
document.getElementsByClassName("divContainer")[0].addEventListener("mouseup", e => {
    lineageIsMoving = false;
});
var lineageSliderInfo = lineageSliderContainer.getBoundingClientRect();
var lineageObjInfo;
var LINEAGE_SLIDE_LENGTH = lineageSliderInfo.top - lineageSliderInfo.bottom;
var LINEAGE_DRAG_OBJECT_LENGTH;
var LINEAGE_LOWER_LIMIT;
var LINEAGE_UPPER_LIMIT;
var INNER_LINEAGE_SLIDER_LENGTH;
var transformLineageUpperLimit;
const scaleYToLineageSliderTrans = d3.scaleLinear();
const scaleYToLineageTrans = d3.scaleLinear();
function moveLineageSlider(y) {
    if (LINEAGE_UPPER_LIMIT >= y) {
        lineageDraggableObjElement.setAttribute("transform", "translate(0, 0)");
        moveLineage(0);
    }
    else if (LINEAGE_LOWER_LIMIT <= y) {
        lineageDraggableObjElement.setAttribute("transform", `translate(0, ${transformLineageUpperLimit})`);
        moveLineage(VIEW_BOX_HEIGHT - lineageHeight);
    }
    else {
        let sliderTrans = scaleYToLineageSliderTrans(y);
        lineageDraggableObjElement.setAttribute("transform", `translate(0, ${sliderTrans})`);
        moveLineage(scaleYToLineageTrans(y));
    }
    lineageObjInfo = lineageDraggableObjElement.getBoundingClientRect();
}

window.addEventListener("keydown", e => {
    if (e.keyCode == '38') {
        // up arrow
        moveLineageSlider(lineageObjInfo.y + LINEAGE_DRAG_OBJECT_LENGTH / 2 - INNER_LINEAGE_SLIDER_LENGTH / numTree);
    }
    else if (e.keyCode == '40') {
        // down arrow
        moveLineageSlider(lineageObjInfo.y + LINEAGE_DRAG_OBJECT_LENGTH / 2 + INNER_LINEAGE_SLIDER_LENGTH / numTree);
    }
});