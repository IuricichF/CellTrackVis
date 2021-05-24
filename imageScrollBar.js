// slider group
const sliderGroup = imgGroup.append("g")
    .attr("transform", "translate(0, " + IMAGE_HEIGHT * 1.01 + ")")
// slider container
sliderGroup.append("rect")
    .attr("id", "scrollBarContainer")
    .attr("stroke", "black")
    .attr("fill", "#a19f99")
    .attr("width", IMAGE_WIDTH)
    .attr("height", IMAGE_WIDTH / 10);
// draggable control object
const draggableObjWidth = IMAGE_WIDTH / NUM_IMAGE + 10;
sliderGroup.append("rect")
    .attr("id", "draggableObj")
    .attr("stroke", "black")
    .attr("fill", "white")
    .attr("width", draggableObjWidth)
    .attr("height", IMAGE_HEIGHT / 10);
let isMoving = false;
let x = 0;
const draggableObj = document.getElementById("draggableObj");
const sliderContainer = document.getElementById("scrollBarContainer");
sliderContainer.addEventListener("mousedown", e => {
    x = e.x;
    isMoving = true;
    move(x);
});
draggableObj.addEventListener("mousedown", e => {
    x = e.x;
    isMoving = true;
    move(x);
});
document.getElementsByClassName("divContainer")[0].addEventListener("mousemove", e => {
    if (isMoving === true) {
        x = e.x;
        move(x);
    }
});
document.getElementsByClassName("divContainer")[0].addEventListener("mouseup", e => {
    isMoving = false;
});
const sliderInfo = sliderContainer.getBoundingClientRect();
const objInfo = draggableObj.getBoundingClientRect();
const SLIDER_LENGTH = sliderInfo.right - sliderInfo.left;
const DRAG_OBJECT_LENGTH = objInfo.right - objInfo.left;
const LOWER_LIMIT = sliderInfo.left + DRAG_OBJECT_LENGTH / 2;
const UPPER_LIMIT = sliderInfo.right - DRAG_OBJECT_LENGTH / 2;
const INNER_SLIDER_LENGTH = UPPER_LIMIT - LOWER_LIMIT;
const scaleBoundToTrans = d3.scaleLinear()
    .domain([LOWER_LIMIT, UPPER_LIMIT])
    .range([0, IMAGE_WIDTH - draggableObjWidth]);
const scalePosToPercent = d3.scaleLinear()
    .domain([LOWER_LIMIT, UPPER_LIMIT])
    .range([0, 1]);
var movedPercent = 0;
function move(x) {
    if (LOWER_LIMIT >= x) {
        draggableObj.setAttribute("transform", "translate(0, 0)");
        updateImage(0);
    }
    else if (UPPER_LIMIT <= x) {
        draggableObj.setAttribute("transform", "translate(" + (IMAGE_WIDTH - draggableObjWidth) + ", 0)");
        updateImage(NUM_IMAGE - 1);
    }
    else {
        let objPos = scaleBoundToTrans(x);
        draggableObj.setAttribute("transform", "translate(" + objPos + ", 0)");
        updateImage(Math.trunc(scalePosToPercent(x) * NUM_IMAGE));
    }
}

window.addEventListener("keydown", e => {
    if (e.keyCode == '37') {
        // left arrow
        console.log(x + INNER_SLIDER_LENGTH / NUM_IMAGE);
        move(x - INNER_SLIDER_LENGTH / NUM_IMAGE);
    }
    else if (e.keyCode == '39') {
        // right arrow
        move(x + INNER_SLIDER_LENGTH / NUM_IMAGE);
    }
});
