var START_COLOR = "#ff0000";
const TRACK_WIDTH = 4;
const RESOLU_WIDTH = 2040;
const RESOLU_HEIGHT = 2040;
const RESOLU_WIDTH_RATIO = IMAGE_WIDTH / RESOLU_WIDTH;
const RESOLU_HEIGHT_RATIO = IMAGE_HEIGHT / RESOLU_HEIGHT;
const scaleX = d3.scaleLinear()
    .domain([0, RESOLU_WIDTH])
    .range([IMAGE_WIDTH / 2, RESOLU_WIDTH * RESOLU_WIDTH_RATIO + IMAGE_WIDTH / 2])
const scaleY = d3.scaleLinear()
    .domain([0, RESOLU_HEIGHT])
    .range([0, RESOLU_HEIGHT * RESOLU_HEIGHT_RATIO])

function drawTracks() {
    var trackPaths = [];
    // get track data
    d3.csv("/src/a_01fld07_05-09-2021-12-48-25.csv").then(trackData => {
        // scale imgIndex to frame
        const scaleImageIndex = d3.scaleLinear()
            .domain([0, NUM_IMAGE - 1])
            .range([0, Math.max(...trackData.map(d => d.FRAME))])
        const imgIndexScaled = Math.trunc(scaleImageIndex(imgIndex));
        // get trackData of frame from 0 to current 
        const trackDataToCurr = trackData.filter(d => d.FRAME <= imgIndexScaled);
        // get the number of tracks
        const maxTracks = Math.max(...trackDataToCurr.map(d => d.track_id_unique_pred)) + 1;
        for (let i = trackPaths.length; i < maxTracks; i++) trackPaths[i] = [];
        // get tracks info into trackPaths
        trackDataToCurr.filter(d => d.FRAME < imgIndexScaled)
            .forEach(d => {
                trackPaths[d.track_id_unique_pred].push([scaleX(d.pos_x), scaleY(d.pos_y)]);
                trackPaths[d.track_id_unique_pred].push([scaleX(+d.pos_x + +d.dt1_n0_dx), scaleY(+d.pos_y + +d.dt1_n0_dy)]);
                trackPaths[d.track_id_unique_pred].push([scaleX(+d.pos_x + +d.dt2_n0_dx), scaleY(+d.pos_y + +d.dt2_n0_dy)]);
            });
        trackDataToCurr.filter(d => d.FRAME == imgIndexScaled)
            .forEach(d => {
                trackPaths[d.track_id_unique_pred].push([scaleX(d.pos_x), scaleY(d.pos_y)]);
                if (scaleImageIndex.invert(imgIndexScaled) + 2 == imgIndex ||
                    scaleImageIndex.invert(imgIndexScaled) + 3 == imgIndex) {
                    trackPaths[d.track_id_unique_pred].push([scaleX(+d.pos_x + +d.dt1_n0_dx), scaleY(+d.pos_y + +d.dt1_n0_dy)]);
                    trackPaths[d.track_id_unique_pred].push([scaleX(+d.pos_x + +d.dt2_n0_dx), scaleY(+d.pos_y + +d.dt2_n0_dy)]);
                } else if (scaleImageIndex.invert(imgIndexScaled) + 1 == imgIndex) {
                    trackPaths[d.track_id_unique_pred].push([scaleX(+d.pos_x + +d.dt1_n0_dx), scaleY(+d.pos_y + +d.dt1_n0_dy)]);
                }
            });

        // build start points
        svg.selectAll("circle")
            .data(trackPaths)
            .attr("cx", d => { if (d[0] != undefined) return +d[0][0] })
            .attr("cy", d => { if (d[0] != undefined) return +d[0][1] })
            .enter()
            .append("circle")
            .attr("cx", d => { if (d[0] != undefined) return +d[0][0] })
            .attr("cy", d => { if (d[0] != undefined) return +d[0][1] })
            .attr("r", TRACK_WIDTH)
            .attr('fill', START_COLOR)
        // build paths
        svg.selectAll("path")
            .data(trackPaths)
            .attr("d", d => d3.line()(d))
            .enter()
            .append("path")
            .attr("d", d => d3.line()(d))
            .attr("fill", "none")
            .attr("stroke", START_COLOR)
            .attr("stroke-width", TRACK_WIDTH);
    });  
}
drawTracks();
