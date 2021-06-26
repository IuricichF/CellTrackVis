const trkData = JSON.parse(localStorage.getItem("trkDataSortedByTrkID")).find(d =>
    d[0].trkID === JSON.parse(localStorage.getItem("setTrkToAnalyseArr"))[+localStorage.getItem("numPageToAnalyse") - 1]
)
const idxToTrkIDPredArr = new Map(JSON.parse(localStorage.getItem("trkIDToTrkIDPredMap"))).get(trkData[0].trkID)
const trkPredData = JSON.parse(localStorage.getItem("trkDataSortedByTrkIDPred")).filter(d =>
    idxToTrkIDPredArr.includes(d[0].trkIDPred)
)
const datasetIdx = localStorage.getItem("datasetIdx");
const numImg = localStorage.getItem("numImg");
