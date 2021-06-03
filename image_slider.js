// image slider
const IMG_SLD_EL = document.getElementById("image_slider");
// left, right keys to change image index
window.addEventListener("keydown", e => {
    if (e.keyCode == "37") {
        // left arrow
        if (+IMG_SLD_EL.value > +IMG_SLD_EL.min) updateImage(--IMG_SLD_EL.value);
    }
    else if (e.keyCode == "39") {
        // right arrow
        if (+IMG_SLD_EL.value < +IMG_SLD_EL.max) {
            console.log(IMG_SLD_EL.value);
            updateImage(++IMG_SLD_EL.value);
        }
    }
});