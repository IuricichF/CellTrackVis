let isMoving = false;
let x = 0;
const draggableObj = document.getElementById('draggableObj');
const scrollBarContainer = document.getElementById('scrollBarContainer');
scrollBarContainer.addEventListener('mousedown', e => {
    x = e.x;
    isMoving = true;
    move(x);
});
draggableObj.addEventListener('mousedown', e => {
    x = e.x;
    isMoving = true;
    move(x);
});
document.getElementsByClassName('divContainer')[0].addEventListener('mousemove', e => {
    if (isMoving === true) {
        x = e.x;
        move(x);
    }
});
document.getElementsByClassName('divContainer')[0].addEventListener('mouseup', e => {
    isMoving = false;
});
const scrollBarInfo = scrollBarContainer.getBoundingClientRect();
const SCROLL_LOWER_LIMIT = scrollBarInfo.left;
const SCROLL_UPPER_LIMIT = scrollBarInfo.right;
const SCROLL_BAR_LENGTH = SCROLL_UPPER_LIMIT - SCROLL_LOWER_LIMIT;
const IMAGE_PERCENT = 1 / NUM_IMAGE;
var movedPercent = 0;
function move(x) {
    movedPercent = (x - SCROLL_LOWER_LIMIT) / SCROLL_BAR_LENGTH;
    if (0 > movedPercent) {
        draggableObj.setAttribute('transform', 'translate(0, 0)');
        updateImage(0);
    }
    else if (1  < movedPercent) {
        draggableObj.setAttribute('transform', 'translate(' + (IMAGE_WIDTH - draggableObjWidth) + ', 0)');
        updateImage(NUM_IMAGE - 1);
    }
    else {
        let objPos = IMAGE_WIDTH * movedPercent - draggableObjWidth / 4;
        draggableObj.setAttribute('transform', 'translate(' + objPos + ', 0)');
        updateImage(Math.trunc(movedPercent / IMAGE_PERCENT));
    }
}