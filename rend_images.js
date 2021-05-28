var imgIndex = 0;
const VIEW_BOX_WIDTH = 2100;
const VIEW_BOX_HEIGHT = 10000;
const IMAGE_WIDTH = 1000;
const IMAGE_HEIGHT = 1000;
const SVG_PERCENT = 75;
const NUM_IMAGE = 289;
const div = d3.select("div")
// svg
const svg = div.append("svg")
    .attr("width", SVG_PERCENT + "%")
    .attr("height", SVG_PERCENT + "%")
    .attr("viewBox", "0 0 " + VIEW_BOX_WIDTH + " " + VIEW_BOX_HEIGHT);
// image group
const imgGroup = svg.append("g")
    .attr("id", "imageDisplay")
    .attr("transform", `translate(0, ${100})`);
const indexDisplay = imgGroup.append("text")
    .attr("class", "imageIndexText")
    .text("Images Index: " + (imgIndex + 1));
indexDisplay.attr("transform", `translate(${(IMAGE_WIDTH - document.getElementsByClassName("imageIndexText")[0].getBBox().width) / 2}, ${-10})`);
// rend image
const img = imgGroup.append("image")
    .attr("href", "/DataVis/src/" + imgIndex + ".png")
    .attr("width", IMAGE_WIDTH)
    .attr("height", IMAGE_HEIGHT);
// function
function updateImage(newIndex) {
    imgIndex = newIndex;
    img.attr("href", "/DataVis/src/" + imgIndex + ".png");
    drawTracks();
    indexDisplay.text("Images Index: " + (imgIndex + 1));
}
