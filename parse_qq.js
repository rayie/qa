
var fs = require("fs");
var Promise = require("bluebird");
Promise.promisifyAll(fs);

var _ = require("lodash");
var newID = 500000;
var increment = 100;
var tagref = { };
var parse = function(data){
  //console.log(data);
  var rows = data.toString().split(/\n/);
  rows.reverse().pop();
  rows.reverse().pop();
  rows.forEach(function(row){
    row = row.replace(/\r/g,"");
    var cols = row.split(/\t/g);
    newID+=increment;

    var tags =  cols[2].split(/,/);

    var entry = {
      _id: newID,
      txt: _.upperFirst(cols[0]),
      kind: cols[1],
      tags: tags
    }

    switch(cols[1]){
      case "mc":
        if ( undefined === cols[3] ){
          console.log("Missing options", cols[0]);
          process.exit();
        }

        cols[3] = _.trimEnd( cols[3].replace(/,{2,}/g,","),",")
        entry.opts = cols[3].split(/\,/g).map(function(str){
          return { txt: _.upperFirst(str) }; 
        });
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

  tagref['all assessments'].forEach(function(e){
    for(var k in tagref){
      if ( k=='all assessments' || k=='demographic' ) { }
      else {
        console.log(k);
        tagref[k].push(e);
      }
    }
  });

  console.log(tagref);
  var proms = [];
  for(var k in tagref){
    if ( k !== "all assessments" ){
      var taskDef = {
        type: "data",
        name: _.upperFirst(k),
        qq: tagref[k],
        upon: { submit: [ ] }
      }
      proms.push( fs.writeFileAsync( "/tmp/sc.copd."+k+".json", JSON.stringify( taskDef, null, "\t" ) ) );
    }
  }
  Promise.all(proms)
  .then(function(results){
    console.log("done with rpoms", results);
  });

}

fs.readFileAsync("/tmp/copd_qq.tsv")
.then(parse)
.catch(function(err){
  console.log(err);
});

