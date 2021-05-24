var imgIndex = 0;
const VIEW_BOX_WIDTH = 2000;
const VIEW_BOX_HEIGHT = 1200;
const IMAGE_WIDTH = 1000;
const IMAGE_HEIGHT = 1000;
const SVG_PERCENT = 75;
const NUM_IMAGE = 289
const div = d3.select("div")
// div
const indexDisplay = div.append("h2")
    .text("Images Index: " + (imgIndex + 1));
// svg
const svg = div.append("svg")
    .attr("width", SVG_PERCENT + "%")
    .attr("height", SVG_PERCENT + "%")
    .attr("viewBox", "0 0 " + VIEW_BOX_WIDTH + " " + VIEW_BOX_HEIGHT);
// image group
const imgGroup = svg.append("g")
    .attr("transform", "translate(" + IMAGE_WIDTH / 2 + ", 0)");
// rend image
const img = imgGroup.append("image")
    .attr('href', '/DataVis/A_01fld07_brightfield/' + imgIndex + '.png')
    .attr("width", IMAGE_WIDTH)
    .attr("height", IMAGE_HEIGHT);
// function
function updateImage(newIndex) {
    imgIndex = newIndex;
    img.attr('href', '/DataVis/A_01fld07_brightfield/' + imgIndex + '.png');
    drawTracks();
    indexDisplay.text("Images Index: " + (imgIndex + 1));
}
