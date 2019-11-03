class DMT3{

    constructor(vertices, faces, edges){
        this.vertices = {};
        this.edges = {};
        this.faces = {};
        vertices.forEach(v=>{
            v.face = [];
            v.coface = [];
            v.arms.forEach(e=>{v.coface.push('e'+e.id);});
            this.vertices['v'+v.id] = v;
        });
        edges.forEach(e=>{
            e.face = ['v'+e.start.id, 'v'+e.end.id];
            e.coface = [];
            e.wings.forEach(f=>{e.coface.push('f'+f.id);});
            this.edges['e'+e.id] = e;
        });
        faces.forEach(f=>{
            f.face = [];
            f.coface = [];
            f.line.forEach(e=>{f.face.push('e'+e.id);})
            this.faces['f'+f.id] = f;
        });
        
        console.log("vertices", this.vertices);
        console.log("edges", this.edges);
        console.log("faces", this.faces);

        this.xmin = Infinity;
        this.xmax = -Infinity;
        this.ymin = Infinity;
        this.ymax = -Infinity;

        for (let v of vertices) {
            if (v.xcoord < this.xmin)
                this.xmin = v.xcoord;
            if (v.xcoord > this.xmax)
                this.xmax = v.xcoord;
            if (v.ycoord < this.ymin)
                this.ymin = v.ycoord;
            if (v.ycoord > this.ymax)
                this.ymax = v.ycoord;
        }

        this.width = 500;
        this.height = 500;

        this.canvas = d3.select('#canvas3')
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox","0 0 500 550");

        this.table = d3.select('#table3');

        this.xScale = d3.scaleLinear()
            .domain([this.xmin, this.xmax])
            .range([50,450])
        this.yScale = d3.scaleLinear()
            .domain([this.ymin, this.ymax])
            .range([450, 50])
        
        //define arrow head
        this.canvas.append('svg:defs').append('svg:marker')
            .attr('id', 'arrowhead')
            .attr('refX', 3)
            .attr('refY', 3)
            .attr('markerWidth', 15)
            .attr('markerHeight', 15)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M 0 0 6 3 0 6 1.5 3')
            .attr('class', 'arrowHead');

        this.markStratification = false;
    }

    clear() {
        this.table.selectAll('li').remove();
        this.canvas.selectAll('g').remove();
        d3.select("#table3_stratification").selectAll('li').remove();

        this.fgroup = this.canvas.append('g')
            .attr('id', 'fgroup')
        this.egroup = this.canvas.append('g')
            .attr('id', 'egroup')
        this.vegroup = this.canvas.append('g')
            .attr('id', 'vegroup')
        this.efgroup = this.canvas.append('g')
            .attr('id', 'efgroup')
        this.vgroup = this.canvas.append('g')
            .attr('id', 'vgroup')

        this.ftgroup = this.canvas.append('g')
            .attr('id', 'ftgroup')
        this.etgroup = this.canvas.append('g')
            .attr('id', 'etgroup');
        this.vtgroup = this.canvas.append('g')
            .attr('id', 'vtgroup');
    }

    draw() {
        this.clear();
        this.computeUL();
        this.computeStratification(); // also find violators
        this.findCritical();
        this.findPair();
        this.drawFaces();
        this.drawEdges();
        this.drawVertices();
    }

    updateStratification(){
        this.markStratification = true;
        let color = d3.scaleOrdinal(d3.schemeCategory10);
        let color_used = [];
        for(let i=0; i<this.stratification.length; i++){
            let sKeyArray = this.stratification[i];
            let color_i = color(i);
            let step = 0;
            while(color_used.indexOf(color_i)!=-1 || step<20){
                color_i = color(i);
                step += 1;
            }
            color_used.push(color_i);
            sKeyArray.forEach(sKey=>{
                if(sKey[0]==='v'){
                    this.canvas.select('#'+sKey)
                        .attr('fill', color_i)
                        .attr('stroke', 'black');
                } else if(sKey[0]==='e'){
                    this.canvas.select('#'+sKey)
                        .attr('stroke', color_i);
                }
            })
        }

        this.updateStratificationText();
    }

    updateStratificationText(){
        let stratification_text = d3.select('#stratification_info');
        let stratificationDetails = stratification_text.selectAll('div')
            .data(this.stratification);
        stratificationDetails.exit().remove();
        stratificationDetails = stratificationDetails.enter().append('div').merge(stratificationDetails)
            .attr("id",(d,i)=>"strata_div"+i);
            
        for(let i=0; i<this.stratification.length; i++){
            let strata = this.stratification[i];
            let strata_div = d3.select("#strata_div"+i);

            let titleData = [i];

            let strataTitle = strata_div.selectAll(".strata_title")
                .data(titleData);
            strataTitle.exit().remove();
            strataTitle = strataTitle.enter().append('li').merge(strataTitle)
                .attr("class","strata_title")
                .html((d)=>"Strata"+(d+1)+": ");
            
            let strata_values = [];
            strata.forEach(sKey=>{
                if(sKey[0]==='v'){
                    strata_values.push(this.vertices[sKey].value);
                } else if(sKey[0]==='e'){
                    strata_values.push(this.edges[sKey].value);
                } else if(sKey[0]==='f'){
                    strata_values.push(this.faces[sKey].value);
                }
            })
            strata_values.sort(function(a, b){return a - b});

            let strataList = strata_div.selectAll('.strata_content')
                .data(strata_values);
            strataList.exit().remove();
            strataList = strataList.enter().append('li').merge(strataList)
                .attr("class","strata_content")
                .html((d)=>'f<sup>-1</sup>('+d+')');
        }

    }

    updateViolator(){
        if(this.markStratification){
            this.canvas.selectAll('circle').attr('fill', 'Gainsboro');
            this.canvas.selectAll('path').attr('stroke','Silver');
            this.markStratification = false;
        }
        let violator_values = [];
        this.violators.forEach(sKey=>{
            if(sKey[0]==='v'){
                this.canvas.select('#'+sKey)
                    .attr('fill','LightCoral')
                    .attr('stroke','red');
                violator_values.push(this.vertices[sKey].value);

            } else if(sKey[0]==='e'){
                this.canvas.select('#'+sKey)
                    .attr('stroke','LightCoral');
                violator_values.push(this.edges[sKey].value);
            } else if(sKey[0]==='f'){
                this.canvas.select('#'+sKey)
                    .attr('fill', 'LightCoral');
                violator_values.push(this.faces[sKey].value);
            }
        })

        let violator_text = this.table.select('#violator3');
        let violatorList = violator_text.selectAll('li')
            .data(violator_values);
        violatorList.exit().remove();
        violatorList = violatorList.enter().append('li').merge(violatorList)
            .html(function (d) {
                return 'f<sup>-1</sup>('+d+')';
            })

    }

    updateCritical(){
        if(this.markStratification){
            this.canvas.selectAll('circle').attr('fill', 'Gainsboro');
            this.canvas.selectAll('path').attr('stroke','Silver');
            this.markStratification = false;
        }
        let critical_values = []
        this.criticalPoints.vertex.forEach(vKey=>{
            this.canvas.select('#'+vKey)
                .attr('fill','Gold')
                .attr('stroke','Goldenrod');
            critical_values.push(this.vertices[vKey].value);
        })
        this.criticalPoints.edge.forEach(eKey=>{
            this.canvas.select('#'+eKey)
                .attr('stroke','Gold');
            critical_values.push(this.edges[eKey].value);
        })
        this.criticalPoints.face.forEach(fKey=>{
            this.canvas.select('#'+fKey)
                .attr('fill','Khaki');
            critical_values.push(this.faces[fKey].value);
        })

        let critical_text = this.table.select('#critical3');
        let criticalList = critical_text.selectAll('li')
            .data(critical_values)
        criticalList.exit().remove();
        criticalList = criticalList.enter().append('li').merge(criticalList)
            .html(function (d) {
                return 'f<sup>-1</sup>(' + d + ')';
            })
    }

    updatePair(){
        if(this.markStratification){
            this.canvas.selectAll('circle').attr('fill', 'Gainsboro');
            this.canvas.selectAll('path').attr('stroke','Silver');
            this.markStratification = false;
        }
        this.drawArrow();

        let noncritical_values = this.noncriticalPair.vePair.concat(this.noncriticalPair.efPair)
        let noncritical_text = this.table.select('#noncritical3');
        let noncriticalList = noncritical_text.selectAll('li')
            .data(noncritical_values)
        noncriticalList.exit().remove();
        noncriticalList = noncriticalList.enter().append('li').merge(noncriticalList)
            .html(function (d) {
                return 'f<sup>-1</sup>(' + d[0].value + ') => f<sup>-1</sup>(' + d[1].value + ')';
            })

    }

    drawArrow() {
        let xScale = this.xScale;
        let yScale = this.yScale;

        let ve = this.vegroup.selectAll('path')
            .data(this.noncriticalPair.vePair)
        ve.exit().remove();
        ve = ve.enter().append('path').merge(ve)
            .attr('id', function (d) {
                return 've'+d[0].id+'to'+d[1].id;
            })
            .attr('class', 'arrowBody')
            .attr('marker-end', 'url(#arrowhead)')
            .attr('d', function (d) {
                let startx = xScale(d[0].xcoord)
                let starty = yScale(d[0].ycoord)
                let endx = d[1].textcoord[0]
                let endy = d[1].textcoord[1]
                let path = d3.path();
                path.moveTo(startx, starty);
                path.lineTo(endx, endy);
                return path.toString()
            })

        let ef = this.efgroup.selectAll('line')
            .data(this.noncriticalPair.efPair)
        ef.exit().remove();
        ef = ef.enter().append('line').merge(ef)
            .attr('id', function (d) {
                return 'ef'+d[0].id+'to'+d[1].id;
            })
            .attr('class', 'arrowBody')
            .attr('marker-end', 'url(#arrowhead)')
            .attr('x1', function (d) {
                let start = d[0].start.xcoord;
                let end = d[0].end.xcoord;
                return xScale((start+end)/2);
            })
            .attr('y1', function (d) {
                let start = d[0].start.ycoord;
                let end = d[0].end.ycoord;
                return yScale((start+end)/2);
            })
            .attr('x2', function (d) {
                let sum = 0;
                for (let p of d[1].point) {
                    sum += p.xcoord;
                }
                return xScale(sum/d[1].point.length);
            })
            .attr('y2', function (d) {
                let sum = 0;
                for (let p of d[1].point) {
                    sum += p.ycoord;
                }
                return yScale(sum/d[1].point.length);
            })
    }

    vePairRemove(){
        if(this.noncriticalPair.vePair.length === 0){
            return
        }
        let vePair2Remove = this.noncriticalPair.vePair[0];
        console.log("vertex2remove",vePair2Remove[0]);
        console.log("edge2remove",vePair2Remove[1]);
        // remove vertex
        let vKey = 'v'+vePair2Remove[0].id;
        this.vertices[vKey].coface.forEach(eKey=>{
            this.edges[eKey].face.splice(this.edges[eKey].face.indexOf(vKey),1);
        })
        let edge2reassign = [];
        this.vertices[vKey].arms.forEach(e=>{
            if(e.start.id === vePair2Remove[0].id){
                e.start = undefined;
            } else if(e.end.id === vePair2Remove[0].id){
                e.end = undefined;
            }
            if(e.id != vePair2Remove[1].id){
                edge2reassign.push(e);
            }
        })

        delete this.vertices[vKey];
        // remove edge
        let eKey = 'e'+vePair2Remove[1].id;
        this.edges[eKey].face.forEach(vKey=>{
            this.vertices[vKey].coface.splice(this.vertices[vKey].coface.indexOf(eKey),1);
        })
        this.edges[eKey].coface.forEach(fKey=>{
            this.faces[fKey].face.splice(this.faces[fKey].face.indexOf(eKey),1);
        })
        let vertex2reassign; // an edge only connects with 2 vertices
        if(this.edges[eKey].start!=undefined){
            let vKey = 'v'+this.edges[eKey].start.id;
            for(let i=0; i<this.vertices[vKey].arms.length; i++){
                if(this.vertices[vKey].arms[i].id === vePair2Remove[1].id){
                    this.vertices[vKey].arms.splice(i,1);
                }
            }
            vertex2reassign = this.vertices[vKey];
        } else {
            let vKey = 'v'+this.edges[eKey].end.id;
            for(let i=0; i<this.vertices[vKey].arms.length; i++){
                if(this.vertices[vKey].arms[i].id === vePair2Remove[1].id){
                    this.vertices[vKey].arms.splice(i,1);
                }
            }
            vertex2reassign = this.vertices[vKey];
        }
        this.edges[eKey].wings.forEach(f=>{
            for(let i=0; i<f.line.length; i++){
                if(f.line[i].id === vePair2Remove[1].id){
                    f.line.splice(i,1);
                }
            }
        })
        delete this.edges[eKey];
        this.noncriticalPair.vePair.splice(0,1);
        this.reassignCoord(vertex2reassign, edge2reassign);
        this.reassignTopo();
        this.computeUL();
        this.computeStratification();
        this.findCritical();
        this.findPair();
        this.drawFaces();
        this.drawEdges();
        this.drawVertices();
        this.updateViolator();
        this.updateCritical();
        this.updatePair();
        this.updateStratificationText();

    }

    reassignCoord(vertex2reassign, edge2reassign){
        edge2reassign.forEach(e=>{
            if(e.start === undefined){
                e.start = vertex2reassign;
            } else {
                e.end = vertex2reassign;
            }
            e.face.push('v'+vertex2reassign.id);
            vertex2reassign.arms.push(e);
            vertex2reassign.coface.push('e'+e.id);
        })
        // **** faces ****
    }

    reassignTopo(){
        for(let vKey in this.vertices){
            let v = this.vertices[vKey];
            v.face = [];
            v.coface = [];
            v.arms.forEach(e=>{v.coface.push('e'+e.id);});
        }
        for(let eKey in this.edges){
            let e = this.edges[eKey];
            e.face = ['v'+e.start.id, 'v'+e.end.id];
            e.coface = [];
            e.wings.forEach(f=>{e.coface.push('f'+f.id);});
        }
        for(let fKey in this.faces){
            let f = this.faces[fKey];
            f.face = [];
            f.coface = [];
            f.line.forEach(e=>{f.face.push('e'+e.id);})
        }
    }


    drawFaces() {
        let xScale = this.xScale;
        let yScale = this.yScale;

        this.checkSpecialFaces();

        let facesArray = Object.values(this.faces);

        let fs = this.fgroup.selectAll('path')
            .data(facesArray);
        fs.exit().remove();
        fs = fs.enter().append('path').merge(fs)
            // .attr('points', function (d) {
            //     let result = '';
            //     for (let p of d.point) {
            //         result += xScale(p.xcoord) + ',' + yScale(p.ycoord) + ' '
            //     }
            //     return result;
            // })
            .attr('d', d => d.d)
            // .attr('class', 'face')
            .attr('stroke', 'none')
            .attr('fill', 'Gainsboro')
            .attr('id', function (d) {
                return 'f' + d.id;
            })

        let fts = this.ftgroup.selectAll('text')
            .data(facesArray);
        fts.exit().remove();
        fts = fts.enter().append('text').merge(fts)
            .attr('x', function (d) {
                let sum = 0;
                for (let p of d.point) {
                    sum += p.xcoord;
                }
                return xScale(sum / d.point.length);
            })
            .attr('y', function (d) {
                let sum = 0;
                for (let p of d.point) {
                    sum += p.ycoord;
                }
                return yScale(sum / d.point.length);
            })
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text(d => d.value)
            .attr('id', function (d) {
                return 'ft' + d.id;
            })
    }

    drawEdges(){
        let xScale = this.xScale;
        let yScale = this.yScale;

        let edgesArray = Object.values(this.edges);

        this.checkSpecialEdges();

        let es = this.egroup.selectAll('path')
            .data(edgesArray)
        es.exit().remove();
        es = es.enter().append('path').merge(es)
            .attr('d', function (d) {
                return d.d;
            })
            // .attr('class', 'edge')
            .attr('stroke-width', 3)
            .attr('stroke', 'Silver')
            .attr('fill','None')
            .attr('id', function (d) {
                return 'e' + d.id;
            })

        let ets = this.etgroup.selectAll('text')
            .data(edgesArray);
        ets.exit().remove();
        ets = ets.enter().append('text').merge(ets)
            .attr('x', d => d.textcoord[0])
            .attr('y', d => d.textcoord[1])
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text(d => d.value)
    }

    drawVertices(){
        let xScale = this.xScale;
        let yScale = this.yScale;

        let verticesArray = Object.values(this.vertices);

        let vs = this.vgroup.selectAll('circle')
            .data(verticesArray);
        vs.exit().remove();
        vs = vs.enter().append('circle').merge(vs)
            .attr('cx', d => xScale(d.xcoord))
            .attr('cy', d => yScale(d.ycoord))
            .attr('r', 10)
            .attr('fill','Gainsboro')
            .attr('stroke','black')
            .attr('id', function (d) {
                return 'v' + d.id;
            })

        let vts = this.vtgroup.selectAll('text')
            .data(verticesArray);
        vts.exit().remove();
        vts = vts.enter().append('text').merge(vts)
            .attr('x', d => xScale(d.xcoord))
            .attr('y', d => yScale(d.ycoord))
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text(d => d.value)
    }

    computeUL(){
        for(let vKey in this.vertices){
            let v = this.vertices[vKey];
            let uCount = 0;
            let lCount = 0;
            let uCount_detail = [];
            let lCount_detail = [];
            v.coface.forEach(eKey=>{
                if(this.edges[eKey].value <= v.value){ 
                    uCount += 1;
                    uCount_detail.push(eKey);
                }
            })
            this.vertices[vKey].uCount = uCount;
            this.vertices[vKey].lCount = lCount;
            this.vertices[vKey].uCount_detail = uCount_detail;
            this.vertices[vKey].lCount_detail = lCount_detail;
        }

        for(let eKey in this.edges){
            let e = this.edges[eKey];
            let uCount = 0;
            let lCount = 0;
            let uCount_detail = [];
            let lCount_detail = [];
            e.face.forEach(vKey=>{
                if(this.vertices[vKey].value >= e.value){ 
                    lCount += 1;
                    lCount_detail.push(vKey);
                }
            })
            e.coface.forEach(fKey=>{
                if(this.faces[fKey].value <= e.value){ 
                    uCount += 1;
                    uCount_detail.push(fKey);
                }
            })
            this.edges[eKey].uCount = uCount;
            this.edges[eKey].lCount = lCount;
            this.edges[eKey].uCount_detail = uCount_detail;
            this.edges[eKey].lCount_detail = lCount_detail;
        }

        for(let fKey in this.faces){
            let f = this.faces[fKey];
            let uCount = 0;
            let lCount = 0;
            let uCount_detail = [];
            let lCount_detail = [];
            f.face.forEach(eKey=>{
                if(this.edges[eKey].value >= f.value){ 
                    lCount += 1;
                    lCount_detail.push(eKey);
                }
            })
            this.faces[fKey].uCount = uCount;
            this.faces[fKey].lCount = lCount;
            this.faces[fKey].uCount_detail = uCount_detail;
            this.faces[fKey].lCount_detail = lCount_detail;
        }
    }

    findViolator(){
        let violatorVertex = [];
        let violatorEdge = [];
        let violatorFace = [];
        for(let vKey in this.vertices){
            let v = this.vertices[vKey];
            if(v.uCount>= 2 || v.lCount>=2 || (v.uCount===1 && v.lCount===1)){
                violatorVertex.push(vKey);
            }
        }
        for(let eKey in this.edges){
            let e = this.edges[eKey];
            if(e.uCount>= 2 || e.lCount>=2 || (e.uCount===1 && e.lCount===1)){
                violatorEdge.push(eKey);
            }
        }
        for(let fKey in this.faces){
            let f = this.faces[fKey];
            if(f.uCount>= 2 || f.lCount>=2 || (f.uCount===1 && f.lCount===1)){
                violatorFace.push(fKey);
            }
        }
        let currentViolators = {"vertex":violatorVertex, "edge":violatorEdge, "face":violatorFace};      
        return currentViolators; 
    }

    findCritical(){
        let criticalVertex = [];
        let criticalEdge = [];
        let criticalFace = [];
        for(let vKey in this.vertices){
            if(this.violators.indexOf(vKey)===-1 && this.vertices[vKey].lCount===0 && this.vertices[vKey].uCount===0){
                criticalVertex.push(vKey);
            }
        }
        for(let eKey in this.edges){
            if(this.violators.indexOf(eKey)===-1 && this.edges[eKey].lCount===0 && this.edges[eKey].uCount===0){
                criticalEdge.push(eKey);
            }
        }
        for(let fKey in this.faces){
            if(this.violators.indexOf(fKey)===-1 && this.faces[fKey].lCount===0 && this.faces[fKey].uCount===0){
                criticalFace.push(fKey);
            }
        }
        this.criticalPoints = {"vertex": criticalVertex, "edge": criticalEdge, "face": criticalFace};
    }

    findPair(){
        let vePair = [];
        let efPair = [];
        for(let vKey in this.vertices){
            if(this.vertices[vKey].uCount===1){
                vePair.push([this.vertices[vKey], this.edges[this.vertices[vKey].uCount_detail[0]]]);
            }
        }
        for(let eKey in this.edges){
            if(this.edges[eKey].uCount===1){
                efPair.push([this.edges[eKey], this.faces[this.edges[eKey].uCount_detail[0]]]);
            }
        }
        this.noncriticalPair = {'vePair': vePair, 'efPair': efPair};

        console.log("DMT3 vepair", this.noncriticalPair.vePair)
    }

    computeStratification() {
        this.stratification = [];
        this.violators = [];
        let currentViolators = this.findViolator();
        let violatorVertex = [];
        let violatorEdge = [];
        let violatorFace = [];
        currentViolators.vertex.forEach(vKey=>{violatorVertex.push(this.vertices[vKey]);})
        currentViolators.edge.forEach(eKey=>{violatorEdge.push(this.edges[eKey]);})
        currentViolators.face.forEach(fKey=>{violatorFace.push(this.faces[fKey]);})

        this.sortByFunctionValue(violatorVertex);
        this.sortByFunctionValue(violatorEdge);
        this.sortByFunctionValue(violatorFace);

        while(violatorVertex.length!=0 || violatorEdge.length!=0 || violatorFace.length!=0){
            if(violatorVertex.length!=0){
                let v = violatorVertex[0];
                let vKey = 'v'+v.id;
                this.stratification.push([vKey]);
                v.coface.forEach(eKey=>{
                    this.edges[eKey].face.splice(this.edges[eKey].face.indexOf(vKey),1);
                })
                v.coface = [];
                this.violators.push(vKey);
            } else if(violatorEdge.length!=0){
                let e = violatorEdge[0];
                let eKey = 'e'+e.id;
                this.stratification.push([eKey]);
                e.face.forEach(vKey=>{
                    this.vertices[vKey].coface.splice(this.vertices[vKey].coface.indexOf(eKey),1);
                })
                e.coface.forEach(fKey=>{
                    this.faces[fKey].face.splice(this.faces[fKey].face.indexOf(eKey),1);
                })
                e.face = [];
                e.coface = [];
                this.violators.push(eKey);
            } else if(violatorFace.length!=0){
                let f = violatorFace[0];
                let fKey = 'f'+f.id;
                this.stratification.push([fKey]);
                f.face.forEach(eKey=>{
                    this.edges[eKey].coface.splice(this.edges[eKey].coface.indexOf(fKey),1);
                })
                f.face = [];
                this.violators.push(fKey);
            }
            this.computeUL();
            currentViolators = this.findViolator();
            violatorVertex = [];
            violatorEdge = [];
            violatorFace = [];
            currentViolators.vertex.forEach(vKey=>{violatorVertex.push(this.vertices[vKey]);})
            currentViolators.edge.forEach(eKey=>{violatorEdge.push(this.edges[eKey]);})
            currentViolators.face.forEach(fKey=>{violatorFace.push(this.faces[fKey]);})
            this.sortByFunctionValue(violatorVertex);
            this.sortByFunctionValue(violatorEdge);
            this.sortByFunctionValue(violatorFace);

        }
        console.log(currentViolators);
        console.log(this.violators)

        let unvisitedSimplex = [];
        Object.keys(this.vertices).forEach(vKey=>{
            if(this.violators.indexOf(vKey)===-1){ unvisitedSimplex.push(vKey); } 
        })
        Object.keys(this.edges).forEach(eKey=>{ 
            if(this.violators.indexOf(eKey)===-1){ unvisitedSimplex.push(eKey); }
        })
        Object.keys(this.faces).forEach(fKey=>{
            if(this.violators.indexOf(fKey)===-1){ unvisitedSimplex.push(fKey); }
        })

        this.connectedComponents = this.computeAllConnectedComponents(unvisitedSimplex);// this does not include violators

        for(let i=0; i<this.connectedComponents.length; i++){
            let cc = this.connectedComponents[i];
            if(cc.length===1){
                this.stratification.push(cc);
            } else{
                let ccInterior = this.computeInterior(cc);
                let ccClosure = this.computeClosure(cc);
                let ccRemaining = this.computeRemainingCC(ccInterior, ccClosure, this.violators);
                this.stratification.push(ccInterior);
                ccRemaining.forEach(rArray=>{ this.stratification.push(rArray); })
            }
        }

        // re-assign face and coface
        this.stratification.forEach(s=>{
            if(s.length===1){
                let sKey = s[0];
                if(sKey[0]==='v'){
                    this.vertices[sKey].coface = [];
                } else if(sKey[0]==='e'){
                    this.edges[sKey].face = [];
                    this.edges[sKey].coface = [];
                } else if(sKey[0]==='f'){
                    this.faces[sKey].face = [];
                }
            } else {
                s.forEach(sKey=>{
                    if(sKey[0]==='v'){
                        this.vertices[sKey].coface.forEach(eKey=>{
                            if(s.indexOf(eKey)===-1){
                                this.vertices[sKey].coface.splice(this.vertices[sKey].coface.indexOf(eKey),1);
                            }
                        })
                    } else if(sKey[0]==='e'){
                        this.edges[sKey].face.forEach(vKey=>{
                            if(s.indexOf(vKey)===-1){
                                this.edges[sKey].face.splice(this.edges[sKey].face.indexOf(vKey),1);
                            }
                        })
                        this.edges[sKey].coface.forEach(fKey=>{
                            if(s.indexOf(fKey)===-1){
                                this.edges[sKey].coface.splice(this.edges[sKey].coface.indexOf(fKey),1);
                            }
                        })
                    } else if(sKey[0]==='f'){
                        this.faces[sKey].face.forEach(eKey=>{
                            if(s.indexOf(eKey)===-1){
                                this.faces[sKey].face.splice(this.faces[sKey].face.indexOf(eKey),1);
                            }
                        })
                    }
                })
            }
        })

        console.log("stratification", this.stratification)
    }

    computeAllConnectedComponents(unvisitedSimplex){
        let connectedComponents = [];
        while(unvisitedSimplex.length>0){
            let ifVisited = {};
            unvisitedSimplex.forEach(sKey=>{ ifVisited[sKey]=false; })
            let cc = this.computeConnectedComponent([], ifVisited, unvisitedSimplex[0]);
            connectedComponents.push(cc);
            cc.forEach(sKey=>{
                unvisitedSimplex.splice(unvisitedSimplex.indexOf(sKey),1);
            })
        }
        return connectedComponents;
    }

    computeConnectedComponent(cc, ifVisited, startSimplex){
        cc.push(startSimplex);
        ifVisited[startSimplex] = true;
        let adjacentSimplex = [];
        if(startSimplex[0]==='v'){
            this.vertices[startSimplex].coface.forEach(eKey=>{ adjacentSimplex.push(eKey); })
        } else if(startSimplex[0]==='e'){
            this.edges[startSimplex].face.forEach(vKey=>{ adjacentSimplex.push(vKey); })
            this.edges[startSimplex].coface.forEach(fKey=>{ adjacentSimplex.push(fKey); })
        } else if(startSimplex[0]==='f'){
            this.faces[startSimplex].face.forEach(eKey=>{ adjacentSimplex.push(eKey); })
        }
        for(let i=0; i<adjacentSimplex.length; i++){
            let sKey = adjacentSimplex[i];
            if(ifVisited[sKey]===false){
                this.computeConnectedComponent(cc, ifVisited, sKey);
            }
        }
        return cc;
    }

    computeInterior(cc){
        let ccMap = {"vertex":[], "edge":[], "face":[]};
        let ccInterior = [];
        cc.forEach(sKey=>{
            if(sKey[0]==='v'){ ccMap.vertex.push(sKey); }
            else if(sKey[0]==='e'){ ccMap.edge.push(sKey); }
            else if(sKey[0]==='f'){ ccMap.face.push(sKey); }
        })
        if(ccMap.face.length>0){
            let edgeMap = {};
            ccMap.edge.forEach(eKey=>{ edgeMap[eKey] = 0; })
            ccMap.face.forEach(fKey=>{
                ccInterior.push(fKey);
                this.faces[fKey].face.forEach(eKey=>{ edgeMap[eKey]+=1; })
            })
            for(let eKey in edgeMap){
                if(edgeMap[eKey]>1){ ccInterior.push(eKey); }
            }
        } else if(ccMap.edge.length>0){ // actually ccMap.edge.length should always >0
            ccInterior = [...cc];
            let vertexMap = {};
            ccMap.vertex.forEach(vKey=>{ vertexMap[vKey] = 0; })
            ccMap.edge.forEach(eKey=>{
                this.edges[eKey].face.forEach(vKey=>{ vertexMap[vKey]+=1; })
            })
            for(let vKey in vertexMap){
                if(vertexMap[vKey]===1){ ccInterior.splice(ccInterior.indexOf(vKey),1); }
            }
        }
        return ccInterior;
    }

    computeClosure(cc){
        let ccMap = {"vertex":[], "edge":[], "face":[]};
        let ccClosure = [...cc];
        cc.forEach(sKey=>{
            if(sKey[0]==='v'){ ccMap.vertex.push(sKey); }
            else if(sKey[0]==='e'){ ccMap.edge.push(sKey); }
            else if(sKey[0]==='f'){ ccMap.face.push(sKey); }
        })
        if(ccMap.face.length>0){

        } else {
            ccMap.edge.forEach(eKey=>{
                this.edges[eKey].face.forEach(vKey=>{
                    if(ccClosure.indexOf(vKey)===-1){ ccClosure.push(vKey); }
                })
            })
        }
        return ccClosure;    
    }

    computeRemainingCC(ccInterior, ccClosure, violatorSet){
        let unionSet = [...new Set([...ccInterior, ...violatorSet])];
        let differenceSet = [];
        ccClosure.forEach(sKey=>{
            if(unionSet.indexOf(sKey)===-1){ differenceSet.push(sKey);}
        })
        let remainingCC = this.computeAllConnectedComponents(differenceSet);
        return remainingCC;

    }

    sortByFunctionValue(array){
        function compare(a,b){
            if(a.value < b.value) {
                return -1;
            } if (a.value > b.value) {
                return 1;
            }
            return 0;
        }
        array.sort(compare);
    }

    checkSpecialEdges() {
        let edgesArray = Object.values(this.edges);

        this.collinearEdges = [];
        for (let i = 0; i < edgesArray.length; i++) {
            let e1 = edgesArray[i];

            //calculate coordinates
            let startx = this.xScale(e1.start.xcoord);
            let starty = this.yScale(e1.start.ycoord);
            let endx = this.xScale(e1.end.xcoord);
            let endy = this.yScale(e1.end.ycoord);
            let cx = (startx + endx) / 2;
            let cy = (starty + endy) / 2;
            let px = startx - cx
            let py = starty - cy

            //check self-looping
            if (startx == endx && starty == endy) {

                //append path and textcoord for self-looping
                let assistx = startx;
                let assisty = starty + 80;
                let pivotcx = (startx+assistx) / 2;
                let pivotcy = (starty+assisty) / 2;
                let pivotpx = startx - pivotcx;
                let pivotpy = starty - pivotcy;
                let x1 = -pivotpy + pivotcx;
                let y1 = pivotpx + pivotcy;
                let x2 = pivotpy + pivotcx;
                let y2 = -pivotpx + pivotcy;
                let r = Math.sqrt(Math.pow(x1-startx,2)+Math.pow(y1-starty,2));

                let path = d3.path();
                path.moveTo(startx, starty);
                path.arcTo(x1, y1, assistx, assisty, r);
                path.arcTo(x2, y2, endx, endy, r)

                e1.d = path.toString();
                e1.textcoord = [assistx, assisty]
            } else {
                //append path and textcoord for straight line
                let path = d3.path();
                path.moveTo(startx, starty);
                path.lineTo(endx, endy);
                e1.d = path.toString();
                e1.textcoord = [cx,cy];
            }

            //check collinear
            let temp = [e1];
            for (let j = i + 1; j < edgesArray.length; j++) {
                let e2 = edgesArray[j]
                if (this.exist(e2, this.collinearEdges))
                    continue;
                if ((e1.start.id == e2.start.id && e1.end.id == e2.end.id) ||
                    (e1.start.id == e2.end.id && e1.end.id == e2.start.id)){
                    temp.push(e2);
                }
            }
            if (temp.length > 1) {
                this.collinearEdges.push(temp)
            }
        }

        for (let group of this.collinearEdges) {
            for (let i = 0; i < group.length; i++) {
                let m = group[i];
                let startx, starty, endx, endy = 0;
                if (m.start.id == group[0].start.id) {
                    startx = this.xScale(m.start.xcoord);
                    starty = this.yScale(m.start.ycoord);
                    endx = this.xScale(m.end.xcoord);
                    endy = this.yScale(m.end.ycoord);
                } else {
                    startx = this.xScale(m.end.xcoord);
                    starty = this.yScale(m.end.ycoord);
                    endx = this.xScale(m.start.xcoord);
                    endy = this.yScale(m.start.ycoord);
                }
                let cx = (startx + endx) / 2;
                let cy = (starty + endy) / 2;
                let px = startx - cx
                let py = starty - cy
                if (i == 0) {
                    let x = -py + cx;
                    let y = px + cy;
                    let r = Math.sqrt(Math.pow(x - startx, 2) + Math.pow(y - starty, 2));
                    let path = d3.path();
                    path.moveTo(startx, starty);
                    path.arcTo(x, y, endx, endy, r);
                    m.d = path.toString();
                    m.textcoord = [(x + cx) / 2, (y + cy) / 2];
                } else if (i == 1) {
                    let x = py + cx;
                    let y = -px + cy;
                    let r = Math.sqrt(Math.pow(x - startx, 2) + Math.pow(y - starty, 2));
                    let path = d3.path();
                    path.moveTo(startx, starty);
                    path.arcTo(x, y, endx, endy, r)
                    m.d = path.toString();
                    m.textcoord = [(x + cx) / 2, (y + cy) / 2];
                }
            }
        }
    }

    exist(element, list) {
        let exists = false;
        for (let l of list) {
            for (let e of l) {
                if (e.id == element.id)
                    exists = true;
            }
        }
        return exists;
    }

    checkSpecialFaces() {
        let facesArray = Object.values(this.faces);

        for (let f of facesArray) {

            //check degeneration
            let distinct = new Set();
            for (let p of f.point) {
                distinct.add(p)
            }

            //dealing with degeneration to a point and a line
            if (distinct.size == 1) {
                let it = distinct.values();
                let p = it.next().value;
                let startx = this.xScale(p.xcoord)
                let starty = this.yScale(p.ycoord)
                let assistx = startx;
                let assisty = starty + 80;
                let pivotcx = (startx+assistx) / 2;
                let pivotcy = (starty+assisty) / 2;
                let pivotpx = startx - pivotcx;
                let pivotpy = starty - pivotcy;
                let x1 = -pivotpy + pivotcx;
                let y1 = pivotpx + pivotcy;
                let x2 = pivotpy + pivotcx;
                let y2 = -pivotpx + pivotcy;
                let r = Math.sqrt(Math.pow(x1-startx,2)+Math.pow(y1-starty,2));

                let path = d3.path();
                path.moveTo(startx, starty);
                path.arcTo(x1, y1, assistx, assisty, r);
                path.arcTo(x2, y2, startx, starty, r)

                f.d = path.toString();

                this.canvas.select('#ft' + f.id)
                    .attr('transform', 'translate(0,40)')
            } else if (distinct.size == 2) {
                //calculate coordinates
                let it = distinct.values();
                let p1 = it.next().value
                let p2 = it.next().value
                let startx = this.xScale(p1.xcoord);
                let starty = this.yScale(p1.ycoord);
                let endx = this.xScale(p2.xcoord);
                let endy = this.yScale(p2.ycoord);
                let cx = (startx + endx) / 2;
                let cy = (starty + endy) / 2;
                let px = startx - cx
                let py = starty - cy
                let x1 = -py + cx;
                let y1 = px + cy;
                let x2 = py + cx;
                let y2 = -px + cy;
                let r = Math.sqrt(Math.pow(x1 - startx, 2) + Math.pow(y1 - starty, 2));

                let path = d3.path();
                path.moveTo(startx, starty);
                path.arcTo(x1, y1, endx, endy, r);
                path.arcTo(x2, y2, startx, starty, r);
                f.d = path.toString();
            } else {
                let startx = this.xScale(f.point[0].xcoord)
                let starty = this.yScale(f.point[0].ycoord)
                let path = d3.path();
                path.moveTo(startx, starty);
                for (let i = 1; i < f.point.length; i++) {
                    let p = f.point[i];
                    path.lineTo(this.xScale(p.xcoord), this.yScale(p.ycoord))
                }
                f.d = path.toString();
            }
        }
    }


}