
var fs = require("fs");
Array.prototype.insertAt = function (i,el){ return this.splice(i,0,el); }
var Promise = require("bluebird");
Promise.promisifyAll(fs);

var _ = require("lodash");
var newID = 500000;
var increment = 100;
var tagref = { };
var CONST = {
  QTXT: 0,
  KIND: 1,
  NA_NOT_ALLOWED: 2,
  CORRECTION_NOT_ALLOWED: 3,
  EXPIRE_ALLOWED: 4,
  CONCURRENCY_NOT_ALLOWED: 3,
  TAGS: 6,
  MAX_OPTS: 7,
  OPTS: 8,
  LOGIC: 10
}

var parse = function(data){
  //console.log(data);
  var rows = data.toString().split(/\n/);
  rows.reverse().pop();
  rows.reverse().pop();
  rows.forEach(function(row){
    row = row.replace(/\r/g,"");
    var cols = row.split(/\t/g);
    newID+=increment;
    //var tags =  cols[CONST.TAGS].replace(/COPD 30 Day calls.*28/,"COPD 30 Day SemiWeekly Call").split(/,/);
    var tags =  cols[CONST.TAGS]
      .replace(/day 7/ig,"CALL")
      .replace(/RESP Intake/ig,"RESP HOMEVISIT")
      .replace(/NMD Intake/ig,"NMD HOMEVISIT")
      .split(/,|;/);

    if ( tags==!undefined ){ 
      console.log("MISSING TAGS", cols.join("\t") );
    }

    if ( !cols[CONST.QTXT].trim() ) return console.log("SKIPPING - missing qtxt", cols.join("\t") );
    if ( !cols[CONST.TAGS].trim() ) return console.log("SKIPPING - missing tags", cols.join("\t") );
    if ( !cols[CONST.KIND].trim() ) cols[CONST.KIND]="ft";
    var entry = {
      _id: newID,
      txt: _.upperFirst(cols[CONST.QTXT]),
      kind: cols[CONST.KIND],
      allow: {
        na: true,
        survey_note: true,
        correction: true,
        expiration: false,
        concurrency: true,
        multiple: 0  //the number of additional instances within a single survey session user allowed to add
      }
    };
    
    if ( cols[CONST.NA_NOT_ALLOWED] ) entry.allow.na=false; 
    if ( cols[CONST.CORRECTION_NOT_ALLOWED] ) entry.allow.correction=false; 
    if ( cols[CONST.EXPIRE_ALLOWED] ) entry.allow.expiration=true;
    if ( cols[CONST.CONCURRENCY_NOT_ALLOWED] ) entry.allow.concurrency=false;

    switch(cols[CONST.KIND]){
      case "mc":
        if ( undefined === cols[CONST.OPTS] ){
          console.log("Missing options", cols[CONST.QTXT]);
          process.exit();
        }

        cols[CONST.OPTS] = _.trimEnd( cols[CONST.OPTS].replace(/,{2,}/g,","),"," );
        entry.opts = cols[CONST.OPTS].split(/\,/g).map(function(str){
          return { txt: _.upperFirst(str.trim()) }; 
        });

        if ( cols[CONST.MAX_OPTS] ){
          if ( cols[CONST.MAX_OPTS].toLowerCase()==="all" ){
              entry.minmax = [ 1, entry.opts.length ];
          }
          else{
            var max = parseInt( cols[CONST.MAX_OPTS] );
            if (isNaN(max)){
              console.log("INVALID MAX OPTS", cols.join("\t"));
              process.exit();
            }
            else{
              entry.minmax = [ 1, max ];
            }
          }
        }
        break;
      default: 
        break;
    }

    if ( cols[CONST.LOGIC].trim() ){ 
      var logic_parts = cols[CONST.LOGIC].trim().split(/;/g);
      /* examples
       * Poor:1
       * hidden 
       * Yes:1,17  -> show next 1 to 17
       * hidden;No:2 -> hide, but if shown and answered as No, show th question 2 steps after this one
       *
       */

      logic_parts.forEach(function(lp){
        lp = lp.trim().toLowerCase();
        if ( lp==="hidden"){
            entry.hidden=true;
            return;
        }
        else{

          var pt = lp.split(/:/);
          var askArray = [];
          if (pt.length === 2){
            if ( pt[1].search(/,/)!==-1 ){
              // there's a range of questions to show for each of opts the matching values
              var ptt = pt[1].split(/,/);
              var start = parseInt( ptt[0], 10 );
              var end = parseInt( ptt[1], 10 );
              for(var i = start; i<=end; i++){
                askArray.push( (newID+i).toString() );
              }
            }
          }else if (pt.length === 1){
              var start = end = parseInt( ptt[0], 10 );
          }
          else{
            console.log("Invalid logic", entry, logic_parts);
            process.exit();
          }


          if ( cols[CONST.KIND] === "mc" ){

            var val = pt[0].toLowerCase(); //  is the value meeting the rule
            entry.opts.forEach(function(opt){
              if ( opt.txt.toLowerCase() === val ){
                opt.ask = [].concat(askArray);
              }
            });

          }
          else if ( cols[CONST.KIND] === "yn" ){
            var val = pt[0].toLowerCase().substr(0,1); //  yes or no
            
            entry.rule = {}; 
            entry.rule[val] =  { ask: askArray };
          }

        }
      })

    }


    tags.forEach(function(t){
      t = t.trim().toLowerCase().replace(/ /g,"-");
      if ( t==""){
        console.log(entry);
        process.exit();
      }
      if ( !_.has( tagref, t) ) tagref[ t ] = [];
      tagref[t].push( entry );
      console.log(t);
    });


  });
  console.log("DONE WITH QQ", tagref['all-assessments']);

  tagref['all-assessments'].forEach(function(e,idx){
    for(var k in tagref){
      if ( k=='all-assessments' ) { }
      else {
        console.log(k);
        //tagref[k].push(e);
        tagref[k].insertAt(idx,e);
      }
    }
  });

  //console.log(tagref);
  var proms = [];
  var taskdef_list = [];
  for(var k in tagref){
    var outpath = "/tmp/flows/sc."+k+".json";
    if ( k !== "all-assessments" ){
      var taskDef = {
        type: "data",
        tags: ["assessment"],
        name: k.toUpperCase().replace(/-/g," "),
        qq: tagref[k],
        upon: { submit: [ ] },
        url: "flows/sc."+k+".json", 
      }

      switch(k){
        case "copd-initial-homevisit":
          [3,7,10,14,17,21,25,28].forEach(function(day){
            taskDef.upon.submit.push({
              name: "COPD 30 DAY CALL - DAY " + day,
              plannedFor: "in " + day + " days",
              url: "flows/sc.copd-30-day-call.json" 
            });
          })
          break;
      }

      proms.push( 
        fs.writeFileAsync(outpath, JSON.stringify( taskDef, null, "\t" )) 
      );

      taskdef_list.push( { url: taskDef.url , name: taskDef.name, plannedFor: "asap" } );
    }
  }
  Promise.all(proms)
  .then(function(results){
    console.log("done with rpoms");
    console.log(taskdef_list);
  });

}
var path_to_source_file = "/Users/raymondie/Downloads/COPD\ ASSESSMENT\ QUESTIONS.xlsx\ -\ AllQuestions.tsv";
fs.readFileAsync(path_to_source_file)
.then(parse)
.catch(function(err){
  console.log(err);
});

