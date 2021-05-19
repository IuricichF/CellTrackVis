var imgIndex = 0;
const ImageWidth = 1000;
const ImageHeight = 1000;
const div = d3.select('div');
const indexDisplay = div.append('h2')
    .text('Images Index: ' + (imgIndex + 1));
const svg = div.append('svg')
    .attr('width', ImageWidth)
    .attr('height', ImageHeight);
const img = svg.append('image')
    .attr('href', './A_01fld07_brightfield/' + imgIndex + '.png')
    .attr('width', ImageWidth)
    .attr('height', ImageHeight);

const PreviousImage = () => {
    if (imgIndex > 0) {
        img.attr('href', './A_01fld07_brightfield/' + (--imgIndex) + '.png')
        indexDisplay.text('Images Index: ' + (imgIndex + 1));
    }
}
const NextImage = () => {
    if (imgIndex < 288) {
        img.attr('href', './A_01fld07_brightfield/' + (++imgIndex) + '.png');
        indexDisplay.text('Images Index: ' + (imgIndex + 1));
    }
}
