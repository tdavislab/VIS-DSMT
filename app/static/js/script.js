let file;
let off;
let dmt;
let dmt2;
let dmt3;
let valuesArray;
let savedConfig

let input = document.getElementById('files');
input.onchange = function (event) {
    file = event.target.files[0];
    handleFileSelect(file);
    this.value = null;
}

function showStratification() {
    dmt3.updateStratification();
}

function markViolators() {
    // dmt.updateViolator();
    // dmt2.updateViolator();
    dmt3.updateViolator();
}

function markCriticals() {
    // dmt.updateCritical();
    // dmt2.updateCritical();
    dmt3.updateCritical();
}

function markPairs() {
    // dmt.updatePair();
    // dmt2.updatePair();
    dmt3.updatePair();
}

function removeEFPairs() {
    // dmt.efPairRemove();
    // dmt2.efPairRemove();
    dmt3.efPairRemove();
}

function removeVEPairs() {
    // dmt.vePairRemove();
    // dmt2.vePairRemove();
    dmt3.vePairRemove();
}

function rollback() {
    valuesArray = undefined;
    if(dmt3.valuesArray){
        valuesArray = dmt3.valuesArray;
    }
    initialzeDMT(off);
    if(valuesArray){
        dmt3.retrieveValues(valuesArray);
    }
}

function saveConfig() {
    savedConfig = dmt3.saveConfig();
}

function retrieveConfig(){
    // dmt3.retrieveConfig(savedConfig);
    dmt3 = new DMT3(savedConfig.vertices, savedConfig.faces, savedConfig.edges);
    dmt3.draw();
}

function exp5() {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        off = this.responseText;
        initialzeDMT()
    });
    oReq.open("GET", "../static/uploads/dmt_sailboat.off");
    oReq.send();
    // d3.select("#randomize_values").style("visibility","hidden");
}

function exp6() {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        off = this.responseText;
        initialzeDMT()
    });
    oReq.open("GET", "../static/uploads/dmt_new_1.off");
    oReq.send();
    // d3.select("#randomize_values").style("visibility","hidden");
}

function exp7() {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        off = this.responseText;
        initialzeDMT()
    });
    oReq.open("GET", "../static/uploads/dmt_new_2.off");
    oReq.send();
    // d3.select("#randomize_values").style("visibility","hidden");
}

function exp1() {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        off = this.responseText;
        initialzeDMT()
    });
    oReq.open("GET", "../static/uploads/dsmt_figure2.off");
    oReq.send();
    // d3.select("#randomize_values").style("visibility","hidden");
}

function exp2() {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        off = this.responseText;
        initialzeDMT()
    });
    oReq.open("GET", "../static/uploads/dsmt_figure3.off");
    oReq.send();
    // d3.select("#randomize_values").style("visibility","hidden");
}

function exp3() {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        off = this.responseText;
        initialzeDMT()
    });
    oReq.open("GET", "../static/uploads/dsmt_figure4.off");
    // oReq.open("GET", "../static/uploads/dsmt_try.off");
    oReq.send();
    // d3.select("#randomize_values").style("visibility","hidden");
}

function exp4() {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        off = this.responseText;
        initialzeDMT()
    });
    oReq.open("GET", "../static/uploads/dsmt_figure6.off");
    oReq.send();
    // d3.select("#randomize_values").style("visibility","hidden");
}

function exp8() {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        off = this.responseText;
        initialzeDMT()
    });
    oReq.open("GET", "../static/uploads/dsmt_exp5.off");
    oReq.send();
    // d3.select("#randomize_values").style("visibility","visible");
}

function exp9() {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        off = this.responseText;
        initialzeDMT()
    });
    oReq.open("GET", "../static/uploads/dsmt_exp6.off");
    oReq.send();
    // d3.select("#randomize_values").style("visibility","visible");
}

function handleFileSelect(file)
{
    let reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function (e) {
        off = reader.result;
        initialzeDMT()
    }
}

function randomizeValues(){
    rollback()
    dmt3.randomizeValues();
}

function initialzeDMT() {
    console.log(off);

    // let read = new Read();
    // read.readOFF(off);
    // dmt = new DMT(read.getVertices(), read.getFaces(), read.getEdges());
    // dmt.draw();

    // let read2 = new Read();
    // read2.readOFF(off);
    // dmt2 = new DMT2(read2.getVertices(), read2.getFaces(), read2.getEdges());
    // dmt2.draw();

    let read3 = new Read();
    read3.readOFF(off);
    dmt3 = new DMT3(read3.getVertices(), read3.getFaces(), read3.getEdges());
    dmt3.draw();
}