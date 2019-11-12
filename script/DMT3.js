class DMT3{

    constructor(vertices, faces, edges){
        // let vertices_new = this.recognizeIdenticalVertices(vertices);
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
        this.curveScale = d3.line()
            .x(d=>this.xScale(d.x))
            .y(d=>this.yScale(d.y))
            .curve(d3.curveCardinal.tension(-1));
        
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
        this.checkSpecialFaces();
        this.drawEdges();
        this.drawVertices();
    }

    randomizeValues(){
        let valuesArray = [];
        for(let i=1; i<= 100; i++){
            valuesArray.push(i);
        }
        this.shuffleArray(valuesArray)
        let idx = 0;
        for(let vKey in this.vertices){
            this.vertices[vKey].value = valuesArray[idx];
            idx += 1;
        }
        for(let eKey in this.edges){
            this.edges[eKey].value = valuesArray[idx];
            idx += 1;
        }
        for(let fKey in this.faces){
            this.faces[fKey].value = valuesArray[idx];
            idx += 1;
        }
        this.draw();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    randomize_a_number(){
        // range: 0-100

    }

    // recognizeIdenticalVertices(vertices){ // currently, only recognize by function values
    //     console.log(vertices)
    //     let vertices_dict = {};
    //     vertices.forEach(v=>{
    //         if(v.value in vertices_dict){
    //             vertices_dict[v.value].push(v);
    //         } else{
    //             vertices_dict[v.value] = [v];
    //         }
    //     })
    //     console.log(vertices_dict)
    //     for(let vf in vertices_dict){
    //         let arms_array = [];
    //         vertices[vf].forEach(v=>{
    //             v.arms.forEach(e=>{
    //                 if(arms_array.indexOf(e)===-1){
    //                     arms_array.push(e);
    //                 }
    //             })
    //         })
    //         vertices[vf].forEach(v=>{
    //             v.arms = arms_array;
    //         })
    //     }


    // }

    // recognizeIdenticalFaces(faces){

    // }

    updateStratification(){
        this.markStratification = true;
        let color = d3.scaleOrdinal(d3.schemeCategory10);
        let color_used = [];
        for(let i=0; i<this.stratification.length; i++){
            let sKeyArray = this.stratification[i];
            let color_i = color(i);
            let step = 0;
            // while(color_used.indexOf(color_i)!=-1 || step<20){
            //     color_i = color(i);
            //     step += 1;
            // }
            color_used.push(color_i);
            sKeyArray.forEach(sKey=>{
                if(sKey[0]==='v'){
                    this.canvas.select('#'+sKey)
                        .attr('fill', color_i)
                        .attr('stroke', 'black');
                } else if(sKey[0]==='e'){
                    this.canvas.select('#'+sKey)
                        .attr('stroke', color_i);
                } else if(sKey[0]==='f'){
                    this.canvas.select('#'+sKey)
                        .attr('fill', color_i)
                        .attr("opacity",0.3)
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
                .html((d)=>"Stratum"+(d+1)+": ");
            
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
            this.canvas.select('#egroup').selectAll('path').attr('stroke','Silver');
            this.canvas.select('#fgroup').selectAll('path').attr('fill','Gainsboro').attr('opacity',1);
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

        let that = this;

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
                let p = d3.select('#e'+d[1].id).node();
                let totalLength = p.getTotalLength();
                let midPoint1 = p.getPointAtLength(totalLength/4);
                let midPoint2 = p.getPointAtLength(totalLength/4*3);
                if(that.calDist(midPoint1, {"x":(startx+endx)/2, "y":(starty+endy)/2})!=0 && that.calDist(midPoint2, {"x":(startx+endx)/2, "y":(starty+endy)/2})!=0){ // a curve, not a straight line
                    return that.drawHalfCurve(p, {"x":startx, "y":starty})
                } else{
                    let path = d3.path();
                    path.moveTo(startx, starty);
                    path.lineTo(endx, endy);
                    return path.toString()
                }
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

    drawHalfCurve(p, startPoint){
        let numSeg = 10;
        let line = d3.line()
                    .x(d=>d.x)
                    .y(d=>d.y)
        let totalLength = p.getTotalLength();
        let endPoint = p.getPointAtLength(totalLength/2);
        let midPoint = p.getPointAtLength(totalLength/4);
        // let curvePenalty = 0;
        let halfCurve = [startPoint];
        if(this.calDist(startPoint, midPoint)===this.calDist(endPoint, midPoint)){
            for(let i=1; i<numSeg; i++){
                halfCurve.push(p.getPointAtLength(totalLength/2*(i/numSeg)));
            }
        } else {
            for(let i=1;i<numSeg;i++){
                halfCurve.push(p.getPointAtLength(totalLength/2*(2-i/numSeg)));
            }
        }
        return line(halfCurve)
    }

    vePairRemove(){
        if(this.noncriticalPair.efPair.length > 0){ // efpair should be removed first, otherwise the system crushes.
            alert("Please remove Edge-Face pairs first!")
            return
        }
        if(this.noncriticalPair.vePair.length === 0){
            return
        }
        let vePair2Remove = this.noncriticalPair.vePair[0];
        let possible_vlocation = {"x":vePair2Remove[0].xcoord,"y":vePair2Remove[0].ycoord};
        // remove vertex
        let vKey = 'v'+vePair2Remove[0].id;
        this.vertices[vKey].coface.forEach(eKey=>{
            this.edges[eKey].face.splice(this.edges[eKey].face.indexOf(vKey),1);
        })
        let edge2reassign = [];
        let face2reassign = []
        this.vertices[vKey].arms.forEach(e=>{
            if(e.start.id === vePair2Remove[0].id){
                e.start = undefined;
            }
            if(e.end.id === vePair2Remove[0].id){
                e.end = undefined;
            }
            if(e.id != vePair2Remove[1].id){
                edge2reassign.push(e);
            }
        })
        this.vertices[vKey].wings.forEach(f=>{
            let point_new = [];
            let pointIndex_new = [];
            for(let i=0; i<f.point.length; i++){
                if(f.point[i].id != vePair2Remove[0].id){
                    point_new.push(f.point[i]);
                }
            }
            f.point = point_new;
            point_new.forEach(p=>{
                pointIndex_new.push(p.id);
            })
            f.pointIndex = pointIndex_new;
            face2reassign.push(f);
        })

        // remove edge
        let eKey = 'e'+vePair2Remove[1].id;
        this.edges[eKey].face.forEach(vKey=>{
            this.vertices[vKey].coface.splice(this.vertices[vKey].coface.indexOf(eKey),1);
        })
        this.edges[eKey].coface.forEach(fKey=>{
            this.faces[fKey].face.splice(this.faces[fKey].face.indexOf(eKey),1);
        })
        let vertex2reassign; // an edge only connects with 2 vertices
        // let face2reassign;
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
            f.lineIndex.splice(f.lineIndex.indexOf(vePair2Remove[1].id),1);
        })

        delete this.vertices['v'+vePair2Remove[0].id];
        delete this.edges['e'+vePair2Remove[1].id];

        this.noncriticalPair.vePair.splice(0,1);
        this.veReassignCoord(vertex2reassign, edge2reassign, face2reassign, possible_vlocation);
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
        this.vePairReorder();
    }

    efPairRemove(){
        if(this.noncriticalPair.efPair.length === 0){
            return
        }
        let efPair2Remove = this.noncriticalPair.efPair[0];
        console.log("edge2remove", efPair2Remove[0])
        console.log("face2remove", efPair2Remove[1])

        // remove face
        let fKey = 'f'+efPair2Remove[1].id;
        let edge2reassign=[];
        let vertex2reassign = [];
        this.faces[fKey].face.forEach(eKey=>{
            this.edges[eKey].coface.splice(this.edges[eKey].coface.indexOf(fKey),1)
        })
        this.faces[fKey].line.forEach(e=>{
            for(let i=0; i<e.wings.length; i++){
                if(this.faces[fKey].id === e.wings[i].id){
                    e.wings.splice(i,1);
                }
            }
            if(e.id!=efPair2Remove[0].id){
                edge2reassign.push(e);
            }
        })
        this.faces[fKey].point.forEach(v=>{
            for(let i=0; i<v.wings.length; i++){
                if(this.faces[fKey].id === v.wings[i].id){
                    v.wings.splice(i,1);
                }
            }
            vertex2reassign.push(v);
        })
        delete this.faces[fKey];

        // remove edge
        let eKey = 'e'+efPair2Remove[0].id;
        this.edges[eKey].face.forEach(vKey=>{
            this.vertices[vKey].coface.splice(this.vertices[vKey].coface.indexOf(eKey),1);
        })
        this.edges[eKey].coface.forEach(fKey=>{
            this.faces[fKey].face.splice(this.faces[fKey].face.indexOf(eKey),1);
        })
        let face2reassign; // one edge can at most connect to 2 faces
        let v_start = this.edges[eKey].start;
        for(let i=0; i<v_start.arms.length; i++){
            if(this.edges[eKey].id === v_start.arms[i].id){
                v_start.arms.splice(i,1);
            }
        }
        let v_end = this.edges[eKey].end;
        for(let i=0; i<v_end.arms.length; i++){
            if(this.edges[eKey].id === v_end.arms[i].id){
                v_end.arms.splice(i,1);
            }
        }
        this.edges[eKey].wings.forEach(f=>{
            for(let i=0; i<f.line.length; i++){
                if(this.edges[eKey].id === f.line[i].id){
                    f.line.splice(i,1);
                }
            }
            if(f.id != efPair2Remove[1].id){
                face2reassign = f;
            }
        })
        delete this.edges[eKey];
        this.noncriticalPair.efPair.splice(0,1);
        this.efReassignCoord(vertex2reassign, edge2reassign, face2reassign);
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
        this.efPairReorder();
    }

    veReassignCoord(vertex2reassign, edge2reassign, face2reassign, possible_vlocation){
        console.log("f2reassign", face2reassign)
        edge2reassign.forEach(e=>{
            if(e.start === undefined){
                e.start = vertex2reassign;
            } 
            if(e.end === undefined) {
                e.end = vertex2reassign;
            }
            vertex2reassign.arms.push(e);
            // avoid intersection with other edges
            let if_intersect = false;
            Object.keys(this.edges).forEach(eKey=>{
                let e2 = this.edges[eKey];
                if(e2.id!=e.id && edge2reassign.indexOf(e2)===-1){
                    let line1 = [{"x":e.start.xcoord, "y":e.start.ycoord}, {"x":e.end.xcoord, "y":e.end.ycoord}];
                    let line2 = [{"x":e2.start.xcoord, "y":e2.start.ycoord}, {"x":e2.end.xcoord, "y":e2.end.ycoord}];
                    if(this.ifLinesIntersect(line1, line2)){
                        if_intersect = true;
                    }
                }
            })
            if(if_intersect){
                e.middle = this.findPossiblePosition(e, possible_vlocation);
            }

        })
        face2reassign.forEach(f=>{
            console.log(f)
            let point = [];
            let pointIndex = [];
            f.line.forEach(e=>{
                if(pointIndex.indexOf(e.start.id)===-1){
                    point.push(e.start);
                    pointIndex.push(e.start.id);
                }
                if(pointIndex.indexOf(e.end.id)===-1){
                    point.push(e.end);
                    pointIndex.push(e.end.id);
                }
            })
            f.point = point;
            f.pointIndex = pointIndex;
        })     
    }

    findPossiblePosition(e, vlocation){
        let px;
        let py;
        if(e.start.xcoord === e.end.xcoord){ // if e is vertical
            px = vlocation.x;
            py = (e.start.ycoord + e.end.ycoord)/2;
        } else if(e.start.ycoord === e.end.ycoord){ // if e is horizontal
            px = (e.start.xcoord + e.end.xcoord)/2;
            py = vlocation.y;
        } else{
            let a1 = (e.start.ycoord - e.end.ycoord) / (e.start.xcoord - e.end.xcoord);
            let b1 = vlocation.y - a1*vlocation.x;
            let a2 = -1 / a1;
            let b2 = (e.start.ycoord+e.end.ycoord)/2 - a2 * (e.start.xcoord+e.end.xcoord)/2;
            px = (b2-b1)/(a1-a2);
            py = a1*px + b1;
        }
        return {"x":px, "y":py};
    }

    efReassignCoord(vertex2reassign, edge2reassign, face2reassign){
        if(face2reassign){
            console.log(face2reassign)
            edge2reassign.forEach(e=>{
                face2reassign.line.push(e);
                console.log(e)
                e.wings.push(face2reassign);
            })
            let line_copy = [...face2reassign.line];
            let pointIndex = [];
            let lineIndex = [];
            let e = line_copy[0];
            let tmpIdx = 0
            // while(line_copy.length>0 && tmpIdx < 10){
            //     lineIndex.push(e.id);
            //     // if(pointIndex.indexOf(e.start.id)===-1){
            //     //     pointIndex.push(e.start.id);
            //     // }
            //     // if(pointIndex.indexOf(e.end.id)===-1){
            //     //     pointIndex.push(e.end.id);
            //     // }
                
                
            //     for(let i=0;i<line_copy.length;i++){
            //         if(line_copy[i].id === e.id){
            //             line_copy.splice(i,1);
            //         }
            //     }
            //     for(let i=0;i<line_copy.length;i++){
            //         let e2 = line_copy[i];
            //         if(e.end.id === e2.start.id || e.end.id === e2.end.id){
            //             pointIndex.push(e.start.id);

            //             // if(pointIndex.indexOf(e.start.id)===-1){
            //             //     pointIndex.push(e.start.id);
            //             // }
            //             // if(pointIndex.indexOf(e.end.id)===-1){
            //             //     pointIndex.push(e.end.id);
            //             // }
            //         } else if(e.start.id === e2.start.id || e.start.id === e2.end.id){
            //             pointIndex.push(e.end.id);
            //             // if(pointIndex.indexOf(e.end.id)===-1){
            //             //     pointIndex.push(e.end.id);
            //             // }
            //             // if(pointIndex.indexOf(e.start.id)===-1){
            //             //     pointIndex.push(e.start.id);
            //             // }   
            //         }
            //         e = e2;
            //     }
                // if(pointIndex.indexOf(e.end.id)===-1){
                //     pointIndex.push(e.end.id);
                // }
                // if(pointIndex.indexOf(e.start.id)===-1){
                //     pointIndex.push(e.start.id);
                // }   
                // // line_copy.forEach(e2=>{
                // //     if(e2.end.id === e.end.id || e2.start.id === e.end.id || e2.start.id === e.start.id || e2.end.id === e.start.id){
                // //         e = e2;
                // //     }
                // // })
            // }
            
            face2reassign.line.forEach(e=>{
                lineIndex.push(e.id);
                if(pointIndex.indexOf(e.start.id)===-1){
                    pointIndex.push(e.start.id);
                }
                if(pointIndex.indexOf(e.end.id)===-1){
                    pointIndex.push(e.end.id);
                }
            })
            let point = [];
            pointIndex.forEach(vId=>{
                let vKey = 'v'+vId;
                point.push(this.vertices[vKey]);
            })
            face2reassign.point = point;
            face2reassign.pointIndex = pointIndex;
            face2reassign.lineIndex = lineIndex;
        }
        vertex2reassign.forEach(v=>{
            let wings = [];
            v.arms.forEach(e=>{
                e.wings.forEach(f=>{
                    if(wings.indexOf(f)===-1){
                        wings.push(f);
                    }
                })
            })
            v.wings = wings;
        })
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
            .attr("opacity",1)

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
        let vePair_freeEdge = []; // free edge: not connect with a face
        let vePair_non_freeEdge = [];
        let efPair_freeface = []; // free face
        let efPair_non_freeface = [];
        for(let vKey in this.vertices){
            if(this.vertices[vKey].uCount===1){
                let v = this.vertices[vKey];
                let e = this.edges[this.vertices[vKey].uCount_detail[0]];
                if(e.wings > 0){
                    vePair_non_freeEdge.push([v,e]);
                } else { vePair_freeEdge.push([v,e]); }
            }
        }
        for(let eKey in this.edges){
            if(this.edges[eKey].uCount===1){
                if(this.edges[eKey].wings.length > 1){
                    efPair_non_freeface.push([this.edges[eKey], this.faces[this.edges[eKey].uCount_detail[0]]])
                } else{
                    efPair_freeface.push([this.edges[eKey], this.faces[this.edges[eKey].uCount_detail[0]]]);
                }
            }
        }
        // re-order vePair and efPair
        let vePair = vePair_freeEdge.concat(vePair_non_freeEdge);
        let efPair = efPair_freeface.concat(efPair_non_freeface);
        console.log("vepair",vePair)
        this.noncriticalPair = {'vePair': vePair, 'efPair': efPair};
    }

    vePairReorder(){
        console.log("ve reordering")
        let vePair_freeEdge = [];
        let vePair_non_freeEdge = [];
        this.noncriticalPair.vePair.forEach(pair=>{
            let e = pair[1];
            if(e.wings.length>0){
                vePair_non_freeEdge.push(pair);
            } else{ vePair_freeEdge.push(pair); }
        })
        this.noncriticalPair.vePair = vePair_freeEdge.concat(vePair_non_freeEdge);
        console.log(this.noncriticalPair.vePair)
    }

    efPairReorder(){
        let efPair_freeface = [];
        let efPair_non_freeface = [];
        this.noncriticalPair.efPair.forEach(pair=>{
            let e = pair[0];
            if(e.wings.length>1){
                efPair_non_freeface.push(pair);
            } else{ efPair_freeface.push(pair); }
        })
        this.noncriticalPair.efPair = efPair_freeface.concat(efPair_non_freeface);
    }

    computeStratification() {
        // main idea: compute violators => remove violators and compute connected componnets => check frontier condition => separate frontiers
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

        // add violators to stratification

        while(violatorVertex.length!=0 || violatorEdge.length!=0 || violatorFace.length!=0){
            if(violatorVertex.length!=0){
                let v = violatorVertex[0];
                let vKey = 'v'+v.id;
                // this.stratification.push([vKey]);
                v.coface.forEach(eKey=>{
                    this.edges[eKey].face.splice(this.edges[eKey].face.indexOf(vKey),1);
                })
                v.coface = [];
                this.violators.push(vKey);
            } else if(violatorEdge.length!=0){
                let e = violatorEdge[0];
                let eKey = 'e'+e.id;
                // this.stratification.push([eKey]);
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
                // this.stratification.push([fKey]);
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

        // compute connected components
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
        this.violators.forEach(v=>{
            this.connectedComponents.push([v]);
        })

        // check frontier condition
        this.stratification = this.separateFrontiers(this.connectedComponents);

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

    }

    computeAllConnectedComponents(unvisitedSimplex){
        let connectedComponents = [];
        let step = 0;
        while(unvisitedSimplex.length>0 && step < 100){
            let ifVisited = {};
            unvisitedSimplex.forEach(sKey=>{ ifVisited[sKey]=false; })
            let cc = this.computeConnectedComponent([], ifVisited, unvisitedSimplex[0]);
            connectedComponents.push(cc);
            cc.forEach(sKey=>{
                unvisitedSimplex.splice(unvisitedSimplex.indexOf(sKey),1);
            })
            step += 1;
        }
        if(step >= 100){
            alert("Too many stratification!")
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

    separateFrontiers(connectedComponents){
        let connectedComponents_closure = [];
        connectedComponents.forEach(cc=>{
            connectedComponents_closure.push(this.computeClosure(cc));
        })
        for(let i=0; i<connectedComponents.length; i++){
            for(let j=0; j<connectedComponents_closure.length; j++){
                let union = this.findUnion(connectedComponents[i], connectedComponents_closure[j]);
                if(this.checkFrontierCondition(connectedComponents[i],union)===false){
                    let cc1 = [...connectedComponents[i]];
                    union.forEach(u=>{
                        cc1.splice(cc1.indexOf(u),1);
                    })
                    let cc_cc1 = this.computeAllConnectedComponents(cc1); // list of list
                    let cc_union = this.computeAllConnectedComponents(union);
                    connectedComponents.splice(i,1);
                    cc_cc1.forEach(cc=>{
                        if(connectedComponents.indexOf(cc)===-1){
                            connectedComponents.push(cc);
                        }
                    })
                    cc_union.forEach(cc=>{
                        if(connectedComponents.indexOf(cc)===-1){
                            connectedComponents.push(cc);
                        }
                    })
                    this.separateFrontiers(connectedComponents);
                }
            }
        }
        return connectedComponents;

    }

    checkFrontierCondition(cc,union){
        // two possible situations that do not violate frontier condition: 1) union = fi; 2) union = cc (s_i \in s_j_closure);
        if(union.length===0 || cc.length === union.length){
            return true;
        }
        return false;
    }

    findUnion(cc1, cc2){
        let union = [];
        cc2.forEach(cc=>{
            if(cc1.indexOf(cc)!=-1){
                union.push(cc);
            }
        })
        return union;
    }

    // computeInterior(cc){
    //     let ccMap = {"vertex":[], "edge":[], "face":[]};
    //     let ccInterior = [];
    //     cc.forEach(sKey=>{
    //         if(sKey[0]==='v'){ ccMap.vertex.push(sKey); }
    //         else if(sKey[0]==='e'){ ccMap.edge.push(sKey); }
    //         else if(sKey[0]==='f'){ ccMap.face.push(sKey); }
    //     })
    //     if(ccMap.face.length>0){
    //         let edgeMap = {};
    //         ccMap.edge.forEach(eKey=>{ edgeMap[eKey] = 0; })
    //         ccMap.face.forEach(fKey=>{
    //             ccInterior.push(fKey);
    //             this.faces[fKey].face.forEach(eKey=>{ edgeMap[eKey]+=1; })
    //         })
    //         for(let eKey in edgeMap){
    //             if(edgeMap[eKey]>1){ ccInterior.push(eKey); }
    //         }
    //     } else if(ccMap.edge.length>0){ // actually ccMap.edge.length should always >0
    //         ccInterior = [...cc];
    //         let vertexMap = {};
    //         ccMap.vertex.forEach(vKey=>{ vertexMap[vKey] = 0; })
    //         ccMap.edge.forEach(eKey=>{
    //             this.edges[eKey].face.forEach(vKey=>{ vertexMap[vKey]+=1; })
    //         })
    //         for(let vKey in vertexMap){
    //             if(vertexMap[vKey]===1){ ccInterior.splice(ccInterior.indexOf(vKey),1); }
    //         }
    //     }
    //     return ccInterior;
    // }

    computeClosure(cc){
        let ccMap = {"vertex":[], "edge":[], "face":[]};
        cc.forEach(sKey=>{
            if(sKey[0]==='v'){ ccMap.vertex.push(sKey); }
            else if(sKey[0]==='e'){ ccMap.edge.push(sKey); }
            else if(sKey[0]==='f'){ ccMap.face.push(sKey); }
        })
        ccMap.face.forEach(fKey=>{
            this.faces[fKey].line.forEach(e=>{
                let eKey = "e"+e.id;
                if(ccMap.edge.indexOf(eKey)===-1){
                    ccMap.edge.push(eKey);
                }
            })
        })
        ccMap.edge.forEach(eKey=>{
            let startKey = 'v'+this.edges[eKey].start.id;
            let endKey = 'v'+this.edges[eKey].end.id;
            if(ccMap.vertex.indexOf(startKey)===-1){
                ccMap.vertex.push(startKey);
            }
            if(ccMap.vertex.indexOf(endKey)===-1){
                ccMap.vertex.push(endKey);
            }
        })
        let ccClosure = [];
        for(let sType in ccMap){
            ccMap[sType].forEach(sKey=>{ ccClosure.push(sKey);})
        }
        return ccClosure;    
    }

    // computeRemainingCC(ccInterior, ccClosure, violatorSet){
    //     let unionSet = [...new Set([...ccInterior, ...violatorSet])];
    //     let differenceSet = [];
    //     ccClosure.forEach(sKey=>{
    //         if(unionSet.indexOf(sKey)===-1){ differenceSet.push(sKey);}
    //     })
    //     let remainingCC = this.computeAllConnectedComponents(differenceSet);
    //     return remainingCC;

    // }

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
        this.collinearEdges_Idx = [];
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
                if(e1.middle){
                    e1.d = this.curveScale([{"x":e1.start.xcoord, "y":e1.start.ycoord}, e1.middle, {"x":e1.end.xcoord, "y":e1.end.ycoord}]);
                    cx = this.xScale(e1.middle.x);
                    cy = this.yScale(e1.middle.y);
                } else{
                    let path = d3.path();
                    path.moveTo(startx, starty);
                    path.lineTo(endx, endy);
                    e1.d = path.toString();
                }
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
                this.collinearEdges.push(temp);
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

    computeDirection(startPt, endPt){
        if (startPt.x === endPt.x && startPt.y >= endPt.y){
            return "verticaldown";
        } else if(startPt.x === endPt.x && startPt.y < endPt.y){
            return "verticalup";
        }
        else{
            return parseInt(Math.atan2(startPt.y - endPt.y, startPt.x - endPt.x)*180/Math.PI);
            // return (startPt.y - endPt.y)/(startPt.x - endPt.x)
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

    calDist(loc1, loc2){
        let dist = Math.sqrt(Math.pow(loc1.x-loc2.x,2)+Math.pow(loc1.y-loc2.y,2));
        return parseInt(dist*100);
    }

    ifLinesIntersect(line1,line2){
        // line = [pt1,pt2]; pt = {x:0,y:0};
        let pt1 = line1[0];
        let pt2 = line1[1];
        let pt3 = line2[0];
        let pt4 = line2[1];
        let x;
        let y;
        if(pt1.x===pt2.x&&pt3.x===pt4.x){ // if two lines are both vertical
            if(pt1.x===pt3.x){
                if((pt3.y<Math.max(pt1.y,pt2.y) && pt3.y>Math.min(pt1.y,pt2.y))||(pt4.y<Math.max(pt1.y,pt2.y) && pt4.y>Math.min(pt1.y,pt2.y))){
                    return true;
                } else{
                    return false;
                }
            } else {
                return false;
            }
        } else if(pt1.x===pt2.x){ // if line1 is vertical
            let a2 = (pt3.y-pt4.y)/(pt3.x-pt4.x);
            let b2 = (pt3.x*pt4.y-pt4.x*pt3.y)/(pt3.x-pt4.x);
            x = pt1.x;
            y = a2*x+b2;
        } else if(pt3.x===pt4.x){ // if line2 is vertical
            let a1 = (pt1.y-pt2.y)/(pt1.x-pt2.x);
            let b1 = (pt1.x*pt2.y-pt2.x*pt1.y)/(pt1.x-pt2.x);
            x = pt3.x;
            y = a1*x+b1;
        } else {
            let a1 = (pt1.y-pt2.y)/(pt1.x-pt2.x);
            let b1 = (pt1.x*pt2.y-pt2.x*pt1.y)/(pt1.x-pt2.x);
            let a2 = (pt3.y-pt4.y)/(pt3.x-pt4.x);
            let b2 = (pt3.x*pt4.y-pt4.x*pt3.y)/(pt3.x-pt4.x);
            if(a1===a2){ // if parallel
                if(b1 === b2){ // line1 and line2 are on the same line
                    if((pt3.x < Math.max(pt1.x, pt2.x) && pt3.x > Math.min(pt1.x, pt2.x)) || (pt4.x < Math.max(pt1.x, pt2.x) && pt4.x > Math.min(pt1.x, pt2.x))){
                        return true;
                    }else{
                        return false
                    }
                } else{
                    return false;
                }
            } else {
                x = (b2-b1)/(a1-a2);
                y = (a1*b2-a2*b1)/(a1-a2);
            }
        }        
        if((Math.min(pt1.x,pt2.x)<x && x<Math.max(pt1.x,pt2.x))&&(Math.min(pt1.y,pt2.y)<y && y<Math.max(pt1.y,pt2.y))&&(Math.min(pt3.x,pt4.x)<x && x<Math.max(pt3.x,pt4.x))&&(Math.min(pt3.y,pt4.y)<y && y<Math.max(pt3.y,pt4.y))){
            return true;
        } else { return false;}
    
    }


}