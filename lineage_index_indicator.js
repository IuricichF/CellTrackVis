const INDICATOR_WIDTH = LINEAGE_WIDTH / NUM_IMAGE + 10;
const INDICATOR_OPACITY = 0.5;
const indexIndicatorGroup = lineageGroup.append("g")
    .attr("id", "indexIndicator")
const indicator = indexIndicatorGroup.append("rect")
    .attr("id", "indicatorObj")
    .attr("stroke", "black")
    .attr("fill", "white")
    .attr("width", INDICATOR_WIDTH)
    .attr("opacity", INDICATOR_OPACITY);
const indicatorElement = document.getElementById("indicatorObj");
const scaleSliderToIndicator = d3.scaleLinear()
    .domain([0, TRANSFORM_UPPER_LIMIT])
    .range([0, LINEAGE_WIDTH - INDICATOR_WIDTH]);
function indicatorMove(trans) {
    indicatorElement.setAttribute("transform", "translate(" + scaleSliderToIndicator(trans) + ", 0)");
}
