var currTrack;
document.getElementById("trackPaths").addEventListener("mousemove", e => {
    if (currTrack) {
        if (document.getElementsByClassName(`${e.target.attributes.class.value}`) != currTrack) {
            for (let item of currTrack) {
                item.attributes.opacity.value = 0.2;
            }
            currTrack = null;
        }
    } else {
        currTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
        for (let item of currTrack) {
            item.attributes.opacity.value = 1;
        }

    }
});
document.getElementById("startPoints").addEventListener("mousemove", e => {
    if (currTrack) {
        if (document.getElementsByClassName(`${e.target.attributes.class.value}`) != currTrack) {
            for (let item of currTrack) {
                item.attributes.opacity.value = 0.2;
            }
            currTrack = null;
        }
    } else {
        currTrack = document.getElementsByClassName(`${e.target.attributes.class.value}`);
        for (let item of currTrack) {
            item.attributes.opacity.value = 1;
        }

    }
});
//document.getElementById("image").addEventListener("mousemove", e => {
//    if (currTrack) {
//        for (let item of currTrack) {
//            item.attributes.opacity.value = 0.2;
//        }
//        currTrack = null;
//    }
//});