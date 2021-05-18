var imgIndex = 0;
const body = d3.select('body');
const svg = body.append('svg')
    .attr('width', '750')
    .attr('height', '750')
const img = svg.append('image')
    .attr('href', '/A_01fld07_brightfield/' + imgIndex + '.png')
    .attr('width', '750')
    .attr('height', '750');

PreviousImage = () => {
    if (imgIndex > 0) {
        img.attr('href', '/A_01fld07_brightfield/' + (--imgIndex) + '.png')
        d3.select('h2').text(imgIndex + 1);
    }
}
NextImage = () => {
    if (imgIndex < 288) {
        img.attr('href', '/A_01fld07_brightfield/' + (++imgIndex) + '.png');
        d3.select('h2').text(imgIndex + 1);
    }
}

    
