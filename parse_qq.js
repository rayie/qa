
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
  OPTS: 8

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

    var tags =  cols[CONST.TAGS].split(/,/);

    var entry = {
      _id: newID,
      txt: _.upperFirst(cols[CONST.QTXT]),
      kind: cols[CONST.KIND],
      tags: tags,
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
          return { txt: _.upperFirst(str) }; 
        });

        if ( cols[CONST.MAX_OPTS] ){
          var max = parseInt( cols[CONST.MAX_OPTS] );
          if (!isNaN(max)){
            entry.minmax = [ 1, max ];
          }
        }
        break;
      default: 
        break;
    }

    tags.forEach(function(t){
      if ( t==""){
        console.log(entry);
        process.exit();
      }
      if ( !_.has( tagref, t) ) tagref[ t ] = [];
      tagref[t].push( entry );
    });

    //console.log(entry);

  });

  tagref['all assessments'].forEach(function(e,idx){
    for(var k in tagref){
      if ( k=='all assessments' || k=='demographic' || k=='casebuild' ) { }
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
    var outpath = "/var/www/superapi/public/flows/tmp/sc.copd."+k+".json";
    outpath = "/tmp/flows/sc.copd."+k+".json";
    if ( k !== "all assessments" ){
      var taskDef = {
        type: "data",
        name: _.upperFirst(k),
        qq: tagref[k],
        upon: { submit: [ ] },
        url: "flows/sc.copd."+k+".json", 
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

fs.readFileAsync("/tmp/copd_qq.tsv")
.then(parse)
.catch(function(err){
  console.log(err);
});

