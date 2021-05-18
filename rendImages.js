const body = d3.select('body');
const svg = body.append('svg')
    .attr('width', '750')
    .attr('height', '750')
const img = svg.append('image')
    .attr('href', '0.tif')
    .attr('width', '750')
    .attr('height', '750');
