var START_COLOR = "#ff0000";
const TRACK_WIDTH = 8;
const RESOLU_WIDTH = 2040;
const RESOLU_HEIGHT = 2040;
const RESOLU_WIDTH_RATIO = IMAGE_WIDTH / RESOLU_WIDTH;
const RESOLU_HEIGHT_RATIO = IMAGE_HEIGHT / RESOLU_HEIGHT;
const scaleX = d3.scaleLinear()
    .domain([0, RESOLU_WIDTH])
    .range([0, RESOLU_WIDTH * RESOLU_WIDTH_RATIO])
const scaleY = d3.scaleLinear()
    .domain([0, RESOLU_HEIGHT])
    .range([100, RESOLU_HEIGHT * RESOLU_HEIGHT_RATIO + 100])
const scaleIndexToFrame = d3.scaleLinear();
const startPointsGroup = svg.append("g")
    .attr("id", "startPoints");
const trackPathsGroup = svg.append("g")
    .attr("id", "trackPaths");
function drawTracks() {
    var trackPaths = [];
    // get track data
    d3.csv("/src/a_01fld07_05-09-2021-12-48-25.csv").then(trackData => {
        // scale imgIndex to frame
        scaleIndexToFrame
            .domain([0, NUM_IMAGE - 1])
            .range([0, Math.max(...trackData.map(d => d.FRAME))])
        const imgIndexScaled = Math.trunc(scaleIndexToFrame(imgIndex));
        // get trackData of frame from 0 to current 
        const trackDataToCurr = trackData.filter(d => d.FRAME <= imgIndexScaled);
        // get the number of tracks
        const maxTracks = Math.max(...trackDataToCurr.map(d => d.track_id_unique));
        for (let i = 0; i <= maxTracks; i++) trackPaths[i] = [];
        // get tracks info into trackPaths
        trackDataToCurr.filter(d => d.FRAME < imgIndexScaled)
            .forEach(d => {
                trackPaths[d.track_id_unique].push([scaleX(d.pos_x), scaleY(d.pos_y)]);
                trackPaths[d.track_id_unique].push([scaleX(+d.pos_x + +d.dt1_n0_dx), scaleY(+d.pos_y + +d.dt1_n0_dy)]);
                trackPaths[d.track_id_unique].push([scaleX(+d.pos_x + +d.dt2_n0_dx), scaleY(+d.pos_y + +d.dt2_n0_dy)]);
            });
        trackDataToCurr.filter(d => d.FRAME == imgIndexScaled)
            .forEach(d => {
                trackPaths[d.track_id_unique].push([scaleX(d.pos_x), scaleY(d.pos_y)]);
                if (scaleIndexToFrame.invert(imgIndexScaled) + 2 == imgIndex ||
                    scaleIndexToFrame.invert(imgIndexScaled) + 3 == imgIndex) {
                    trackPaths[d.track_id_unique].push([scaleX(+d.pos_x + +d.dt1_n0_dx), scaleY(+d.pos_y + +d.dt1_n0_dy)]);
                    trackPaths[d.track_id_unique].push([scaleX(+d.pos_x + +d.dt2_n0_dx), scaleY(+d.pos_y + +d.dt2_n0_dy)]);
                } else if (scaleIndexToFrame.invert(imgIndexScaled) + 1 == imgIndex) {
                    trackPaths[d.track_id_unique].push([scaleX(+d.pos_x + +d.dt1_n0_dx), scaleY(+d.pos_y + +d.dt1_n0_dy)]);
                }
            });
        startPointsGroup.selectAll("circle").remove();
        trackPathsGroup.selectAll("path").remove();
        // build start points
        startPointsGroup.selectAll("circle")
            .data(trackPaths)
            .enter()
            .append("circle")
            .attr("class", d => `${trackPaths.indexOf(d)}`)
            .attr("cx", d => d[0]? d[0][0] : 0)
            .attr("cy", d => d[0]? d[0][1] : 0)
            .attr("r", TRACK_WIDTH)
            .attr('fill', START_COLOR)
            .attr("opacity", 0.2);
        // build paths
        trackPathsGroup.selectAll("path")
            .data(trackPaths)
            .enter()
            .append("path")
            .attr("class", d => `${trackPaths.indexOf(d)}`)
            .attr("d", d => d3.line()(d))
            .attr("fill", "none")
            .attr("stroke", START_COLOR)
            .attr("stroke-width", TRACK_WIDTH)
            .attr("opacity", 0.2);

        // allow the the track to stay hightlighted while changing image index
        if (currTrack) {
            for (let item of currTrack) {
                item.attributes.opacity.value = 1;
            }
        }
    });  
}
drawTracks();
