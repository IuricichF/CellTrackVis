const RADIUS = 5;
const RESOLU_WIDTH = 2040;
const RESOLU_HEIGHT = 2040;
const RESOLU_WIDTH_RATIO = ImageWidth / RESOLU_WIDTH;
const RESOLU_HEIGHT_RATIO = ImageHeight / RESOLU_HEIGHT;
const UpdateTracks = () => {
    if (imgIndex % 3 == 0) {
        svg.selectAll('circle').remove();
        d3.csv('/A_01fld07_brightfield/a_01fld07_05-09-2021-12-48-25.csv').then(data => {
            data.filter(d => d.FRAME == imgIndex / 3)
                .forEach(d => {
                    svg.append('circle')
                        .attr('r', RADIUS)
                        .attr('fill', '#ff0008')
                        .attr('cx', d.pos_x * RESOLU_WIDTH_RATIO)
                        .attr('cy', d.pos_y * RESOLU_HEIGHT_RATIO);
                })
        })
    }
}
UpdateTracks();