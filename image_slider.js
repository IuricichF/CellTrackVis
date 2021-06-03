// image slider
const IMG_SLD_EL = document.getElementById("image_slider");
// slider label
const IMG_SLD_TXT = d3.select("#imageSliderContainer").append("label")
    .attr("for", "#image_slider")
    .text(`Image Index: ${IMG_SLD_EL.value}`);
