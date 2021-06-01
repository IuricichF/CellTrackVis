var currTrack = [];
var selectedTrack = [];
// move on tracks on images
document.getElementById("trackPaths").addEventListener("mousemove", e => {
    let newTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
    if (newTrack != selectedTrack) {
        if (currTrack) {
            if (newTrack != currTrack) {
                if (currTrack != selectedTrack) {
                    for (let item of currTrack) {
                        item.attributes.opacity.value = 0.2;
                    }
                }
                currTrack = newTrack;
                for (let item of newTrack) {
                    item.attributes.opacity.value = 0.4;
                }
            }
        } else {
            currTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
            for (let item of currTrack) {
                item.attributes.opacity.value = 0.4;
            }
        }
    }
});
// move on starting circles on images
document.getElementById("startPoints").addEventListener("mousemove", e => {
    let newTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
    if (newTrack != selectedTrack) {
        if (currTrack) {
            if (newTrack != currTrack) {
                if (currTrack != selectedTrack) {
                    for (let item of currTrack) {
                        item.attributes.opacity.value = 0.2;
                    }
                }
                currTrack = newTrack;
                for (let item of newTrack) {
                    item.attributes.opacity.value = 0.4;
                }
            }
        } else {
            currTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
            for (let item of currTrack) {
                item.attributes.opacity.value = 0.4;
            }
        }
    }
});
// move on tree trakcs on lineage
document.getElementById("treePaths").addEventListener("mousemove", e => {
    let newTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
    if (newTrack != selectedTrack) {
        if (currTrack) {
            if (newTrack != currTrack) {
                if (currTrack != selectedTrack) {
                    for (let item of currTrack) {
                        if (item.attributes.opacity) item.attributes.opacity.value = 0.2;
                    }
                }
                currTrack = newTrack;
                for (let item of newTrack) {
                    if (item.attributes.opacity) item.attributes.opacity.value = 0.4;
                }
            }
        } else {
            currTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
            for (let item of currTrack) {
                item.attributes.opacity.value = 0.4;
            }
        }
    }
});
// click and select on tracks on images
document.getElementById("trackPaths").addEventListener("mousedown", e => {
    newTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
    if (newTrack != selectedTrack) {
        for (let item of selectedTrack) {
            item.attributes.opacity.value = 0.2;
        }
        selectedTrack = newTrack;
        currTrack = newTrack
        let temp;
        for (let item of selectedTrack) {
            item.attributes.opacity.value = 1;
            temp = item.parentElement.attributes?.transform?.value;
        }
        moveLineageCenter(temp.replace(/\D/g, ""));
    }

});
// click and select on starting circles on images
document.getElementById("startPoints").addEventListener("mousedown", e => {
    newTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
    if (newTrack != selectedTrack) {
        for (let item of selectedTrack) {
            item.attributes.opacity.value = 0.2;
        }
        selectedTrack = newTrack;
        currTrack = newTrack
        let temp;
        for (let item of selectedTrack) {
            item.attributes.opacity.value = 1;
            temp = item.parentElement.attributes?.transform?.value;
        }
        moveLineageCenter(temp.replace(/\D/g, ""));
    }
});
// click and select on tree tracks on lineage
document.getElementById("treePaths").addEventListener("mousedown", e => {
    // move image index
    let startX = e.path[0].attributes.d.value.split(",")[0].slice("1");
    move(scalePosToPercent.invert((scaleIndexToFrame.invert(scaleFrameToLineagePoint.invert(startX)) + 1) / NUM_IMAGE))
    newTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
    if (newTrack != selectedTrack) {
        for (let item of selectedTrack) {
            if (item.attributes.opacity) item.attributes.opacity.value = 0.2;
        }
        selectedTrack = newTrack;
        currTrack = newTrack
        let temp;
        for (let item of selectedTrack) {
            if (item.attributes.opacity) item.attributes.opacity.value = 1;
            temp = item.parentElement.attributes?.transform?.value;
        }
        moveLineageCenter(temp.replace(/\D/g, ""));
    }

});
document.getElementById("image").addEventListener("mousemove", e => {
    if (currTrack != selectedTrack) {
        for (let item of currTrack) {
            item.attributes.opacity.value = 0.2;
        }
        currTrack = [];
    }
});
document.getElementById("lineageBG").addEventListener("mousemove", e => {
    if (currTrack != selectedTrack) {
        for (let item of currTrack) {
            if (item.attributes.opacity) item.attributes.opacity.value = 0.2;
        }
        currTrack = [];
    }
});
