const RADIUS = 5;
const RESOLU_WIDTH = 2040;
const RESOLU_HEIGHT = 2040;
const RESOLU_WIDTH_RATIO = IMAGE_WIDTH / RESOLU_WIDTH;
const RESOLU_HEIGHT_RATIO = IMAGE_HEIGHT / RESOLU_HEIGHT;
var data = null;
d3.csv('/DataVis/A_01fld07_brightfield/a_01fld07_05-09-2021-12-48-25.csv').then(csv => { data = csv });
let previousIndex = 0;
function updateTracks() {
    data.filter(d => d.FRAME <= imgIndex  / 4&& d.FRAME > previousIndex / 4)
        .forEach(d => {
            svg.append('circle')
                .attr('id', d.FRAME)
                .attr('r', RADIUS)
                .attr('fill', '#ff0008')
                .attr('cx', d.pos_x * RESOLU_WIDTH_RATIO + IMAGE_WIDTH / 2)
                .attr('cy', d.pos_y * RESOLU_HEIGHT_RATIO );
        })
    previousIndex = imgIndex;
}
