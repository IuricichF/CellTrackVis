const LINEAGE_WIDTH = 1000;
const TREE_HEIGHT = 200;
// lineage group
const lineageGroup = svg.append("g")
    .attr("id", "lineageTree")
    .attr("transform", "translate(" + (IMAGE_WIDTH + 100) + ", 0)");
// lineage tree back ground
const lineageBG = lineageGroup.append("rect")
    .attr("id", "lineageBG")
    .attr("fill", "gray")
    .attr("width", LINEAGE_WIDTH)
// texts indicate limits (1 -> NUM_IMAGE)
const lowerIndexText = lineageGroup.append("text")
    .attr("class", "lineageText")
    .text("1")
const upperIndexText = lineageGroup.append("text")
    .attr("class", "lineageText")
    .text(`${NUM_IMAGE}`);
upperIndexText.attr("x", IMAGE_WIDTH - document.getElementsByClassName("lineageText")[1].getBBox().width);
// tree paths group
const treePathsGroup = lineageGroup.append("g")
    .attr("id", "treePaths");
// tree texts group
const treeTextsGroup = lineageGroup.append("g")
    .attr("id", "treeText");
d3.csv("/DataVis/src/a_01fld07_05-09-2021-12-48-25.csv").then(trackData => {
    // set lineage tree back ground height
    const NUM_ID = Math.max(...trackData.map(d => d.track_id_unique));
    const NUM_TREE = Math.max(...trackData.map(d => d.TRACK_ID)) - 1;
    const LINEAGE_HEIGHT = NUM_TREE * TREE_HEIGHT;
    lineageBG.attr("height", LINEAGE_HEIGHT);
    lowerIndexText.attr("y", LINEAGE_HEIGHT - 10);
    upperIndexText.attr("y", LINEAGE_HEIGHT - 10);
    indicator.attr("height", LINEAGE_HEIGHT);
    viewBoxHeight = LINEAGE_HEIGHT;
    svg.attr("viewBox", "0 0 " + VIEW_BOX_WIDTH + " " + viewBoxHeight);
    // build data for each tree
    const treeData = [];
    // populate tree data for each track
    for (let id = 0; id < NUM_ID; id++) {
        // get track
        let tempTrack = trackData.filter(d => d.track_id_unique == id + 1);
        if (tempTrack) {
            // initialization
            treeData[id] = new Object();
            // ID
            treeData[id].generalID = tempTrack[0].TRACK_ID;
            treeData[id].uniqueID = tempTrack[0].track_id_unique;
            // assign itself to the child of itself
            treeData[id].children = [new Object()];
            treeData[id].children[0].generalID = treeData[id].generalID;
            treeData[id].children[0].uniqueID = treeData[id].uniqueID;
            treeData[id].children[0].children = [];
            // interval of existence
            treeData[id].intervalOfExist = [tempTrack[0].FRAME, tempTrack[tempTrack.length - 1].FRAME];
            // children tracks
            if (tempTrack[0].track_id_parent != 0) {
                if (!treeData[tempTrack[0].track_id_parent - 1].children[0].children.includes(treeData[id])) {
                    treeData[tempTrack[0].track_id_parent - 1].children[0].children.push(treeData[id]);
                }
            }
        }
    }
    const roots = [];
    const links = [];
    const linkHorizontal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
    // scale
    const scaleFrameToLineagePoint = d3.scaleLinear()
        .domain([0, scaleIndexToFrame(NUM_IMAGE - 1)])
        .range([0, LINEAGE_WIDTH]);
    // the function which return last appearing frame of the tree
    function getLastAppearFrame(obj) {
        let lastFrame = obj.intervalOfExist[1];
        let temp = [];
        obj.children[0].children
            .forEach(d => {
                temp.push(getLastAppearFrame(d));
            })
        lastFrame = Math.max(lastFrame,...temp);
        return lastFrame;
    }
    // function that customize the tree by changing depth value
    function setRootDepth(root) {
        root.depth = treeData.find(d => d.uniqueID == root.data.uniqueID).intervalOfExist[0];
        root.children[0].depth = treeData.find(d => d.uniqueID == root.data.uniqueID).intervalOfExist[1];
        root.children[0].children
            ?.forEach(d => {
                setRootDepth(d);
            })
    }
    // set up roots and links
    for (let i = 0; i < NUM_TREE; i++) {
        // get track info
        let tempTrack = treeData[Math.min(...trackData.filter(d => d.TRACK_ID == i).map(d => d.track_id_unique)) - 1];
        if (tempTrack) {
            // set width of the tree to the lineage point of last appear frame
            let treeWidth = scaleFrameToLineagePoint(getLastAppearFrame(tempTrack));
            let treeLayout = d3.tree().size([TREE_HEIGHT, treeWidth]);
            // set root
            roots[i] = d3.hierarchy(tempTrack);
            // customize the tree
            setRootDepth(roots[i]);
            // generate link
            links[i] = treeLayout(roots[i]).links();
        }
    }

    // draw trees using information from links
    for (let i = 0; i < links.length; i++) {
        if (links[i]) {
            let currTree = treePathsGroup.append("g")
                .attr("id", `General Track ID: ${links[i][0].source.data.generalID}`)
                .attr("transform", `translate(0, ${i * TREE_HEIGHT})`);
            currTree.selectAll()
                .data(links[i])
                .enter()
                .append("path")
                .attr("class", d => d.source.data.uniqueID)
                .attr("d", linkHorizontal)
                .attr("opacity", 0.2)
                .attr("fill", "none")
                .attr("stroke", START_COLOR)
                .attr("stroke-width", TRACK_WIDTH);

            //currTree.selectAll("text")
            //    .data(roots[i].descendants())
            //    .enter()
            //    .append("text")
            //    .attr("x", d => d.y)
            //    .attr("y", d => d.x)
            //    .attr("class", "lineageText")
            //    .text(d => `Track ID: ${d.data.uniqueID}`);
            //currTree.selectAll(`text[x="${LINEAGE_WIDTH}"]`).remove();
        }
    }
});
