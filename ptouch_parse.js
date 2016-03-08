
var fs = require("fs");
var request = require("request");
var MongoDB = require("mongodb");
var MC = MongoDB.MongoClient;
var db = { test: 1 };

var j = request.jar();
var cookie = request.cookie('HC_Production=ui9dkhnncl1qmui0d9dgrh16j0');
var basePath =  "https://secure.healthcall.net";
j.setCookie(cookie, basePath);

Array.prototype.insertAt = function (i,el){ return this.splice(i,0,el); }
var Promise = require("bluebird");
Promise.promisifyAll(fs);
var env = require('jsdom').env;
var headers = { 
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.103 Safari/537.36' 
};


var _ = require("lodash");
var patientlist = [];

var parse = function(data){
  try{ 
      patientlist = JSON.parse(data); 
      console.log(data.length);
      //data.forEach(parserow);
      nextPatient();
  }
  catch(err){
    throw new Error(err);
  }
}


var nextPatient = function( pdata  ){

  if ( pdata ){
    db.coll.save(pdata)
    .then(function(r){
      //console.log(r);
    })
    .catch(function(err){
      
      console.log(err);
    });
  }



  if (patientlist.length===0) return;
  var entry = patientlist.pop();
  delete entry.Links;
  console.log(entry['First Name'],entry['Last Name'],entry['Record ID'] );
  return eachPatient(entry); 
}

var currentPatient = null;

function eachPatient(p){
  currentPatient = _.clone(p);
  currentPatient.patientHealthCallID = p.href.split(/\//g)[4];

  //console.log(currentPatient.patientHealthCallID ); return nextPatient();
  
  var opts = {
    jar: j, 
    url: basePath+p.href,
    headers: headers
  };
  reqPage(opts,"Panel");
}

function reqPage(opts,com){
  //console.log(opts);
  request(opts, function(err,resp){
    if ( err ){
      console.log("FAILED", err);
      process.exit();
    }
    
    if ( resp.body.substr(2,3)==="DOC" ){
      var html = resp.body.substr("<!DOCTYPE html>".length);
    }
    else{
      var html = resp.body;
    }

    html = html.replace(/\n/g,"");
    //console.log("\n\n***GOT RESPONSE**\n",com);//,err,html);
    workDom(html,com);
  })
}

function workDom(html,com){
  //html = "<html><body></body></html>";
  var pkg = { 
    html: html, 
    onload: function(window){
      //console.log(window);
      var $ = require("jquery")(window);
      WORK[com]($,window);
    }
  };
  env(pkg);

}

var WORK = {
// panel info
  Panel: function($,window){
    var a = [];
    $("section.panel .panel-body .widget-content-collapsed,section.panel .panel-body .widget-content-expanded").each(function(idx,el){
      var h = $(el).html().replace(/ {2,}/g,"");

      var n = $(".pull-left",el).length;
      for( var i =0; i < n; i++ ){
        var rec = {
          k: $.trim( $(".pull-left",el).eq(i).text().replace(/\n/g,"") ).replace(/\./g,"_"),
          v: $.trim( $(".pull-right",el).eq(i).text().replace(/\n/g,"") )
        };
        //console.log(rec);
        // console.log(h);
        a.push(rec);
      }
    })
    currentPatient.basic = {};
    a.forEach(function(r){
      currentPatient.basic[r.k]=r.v;   
    });


    var nextUrl = "/patient/info/show/program";
    var opts = {
      jar: j, 
      url: basePath+nextUrl,
      headers: headers
    };
    //clear the window
    window.close();
    return reqPage(opts,"Programs");
  },

  Programs: function($,window){
    //console.log("work programs", $(".row").length);
    currentPatient.programs = [ ];
    $(".row").each(function(idx,row){
      var prog = {
        programTitle : $(".panel-title",row).text()
      };
      //console.log("ProgramTitle", programTitle);
      $(".panel-body tr",row).each(function(idx,tr){
        prog[ $.trim( $("td",tr).eq(0).text() ) ] = $.trim(  $("td",tr).eq(1).text() );
      }); 
      //console.log(prog);
      currentPatient.programs.push(prog);
    });
    //console.log(currentPatient);
    var nextUrl = "/patient/info/show/team";
    var opts = {
      jar: j, 
      url: basePath+nextUrl,
      headers: headers
    };
    //clear the window
    window.close();
    return reqPage(opts,"Team");
  },

  Team: function($,window){
    //console.log("work programs", $(".row").length);
    currentPatient.teams = [ ];
    $(".row").each(function(idx,row){
      var team = {
        teamTitle : $(".panel-title",row).text()
      };
      //console.log("ProgramTitle", programTitle);
      $(".panel-body tr",row).each(function(idx,tr){
        team[ $.trim( $("td",tr).eq(0).text() ) ] = $.trim(  $("td",tr).eq(1).text() );
      }); 
      //console.log(prog);
      currentPatient.teams.push(team);
    });
    //console.log(currentPatient);
    var nextUrl = "/note/index/format/html?page=1&limit=&suffix=";
    var opts = {
      jar: j, 
      url: basePath+nextUrl,
      headers: headers
    };
    //clear the window
    window.close();
    return reqPage(opts,"Notes");
  },

  Notes: function($,window){


    currentPatient.notes = [];
    currentPatient.notePage = 1;
    currentPatient.notePageCount = 1;

    $("tbody tr").each(function(idx,tr){
      var tds = $("td",tr);
      var note = {};
      note["txt"] = tds.eq(0).children("div").eq(0).text();
      note["topic"] = tds.eq(1).text();
      note["user"] = tds.eq(2).text();
      note["dt"] = tds.eq(3).text();

      for(var k in note){ note[k]=note[k].trim() };
      //console.log(note); 
      currentPatient.notes.push(note);
    });
    
    currentPatient.notePage++;

    var noteCount = $("#datatable-details_info").text();
    console.log(noteCount);
    var pos =  noteCount.search(/Notes$/);
    if ( pos == -1 ){
      
    }

    currentPatient.noteCount = parseInt( noteCount.substr(0,pos), 10 );

    if ( isNaN( currentPatient.noteCount ) ){
      console.log("Failed getting note Count ");
      process.exit();
    }
    

    console.log("parsed:",currentPatient.noteCount);

    currentPatient.notePageCount = Math.floor( currentPatient.noteCount / 20 ) + 1;

    if ( currentPatient.notePageCount === 1 ){
      console.log("no more notes, do status...");
      var nextUrl = "/patient/status";
      var opts = {
        jar: j, 
        url: basePath+nextUrl,
        headers: headers
      };
      window.close();
      return reqPage(opts,"Status");
    }
    else{
      console.log( "total note pages: " + currentPatient.notePageCount );
    }

    var nextUrl = this._buildNextNoteUrl();
    console.log("nextUrl:",nextUrl);
    var opts = {
      jar: j, 
      url: basePath+nextUrl,
      headers: headers
    };
    //clear the window
    window.close();
    return reqPage(opts,"NextNotePage");

  },

  _buildNextNoteUrl : function(){

    return "/note/index/format/html?applying_filter=0&is_form_action=1&note_added=&page="+currentPatient.notePage+"&limit=20&patient_id=" + currentPatient.patientHealthCallID; 

  },

  NextNotePage: function($,window){

    console.log("On note page: ", currentPatient.notePage, " out of ", currentPatient.notePageCount);

    $("tbody tr").each(function(idx,tr){
      var tds = $("td",tr);
      var note = {};
      note["txt"] = tds.eq(0).children("div").eq(0).text();
      note["topic"] = tds.eq(1).text();
      note["user"] = tds.eq(2).text();
      note["dt"] = tds.eq(3).text();
      for(var k in note){ note[k]=note[k].trim() };
      currentPatient.notes.push(note);
    });

    if ( currentPatient.notePageCount === currentPatient.notePage ){

      console.log("no more notes, do status...");
      var nextUrl = "/patient/status";
      var opts = {
        jar: j, 
        url: basePath+nextUrl,
        headers: headers
      };
      window.close();
      return reqPage(opts,"Status");
    }

    currentPatient.notePage++;
    var nextUrl = this._buildNextNoteUrl();
    console.log("nextUrl:",nextUrl);
    var opts = {
      jar: j, 
      url: basePath+nextUrl,
      headers: headers
    };
    window.close();
    //clear the window
    return reqPage(opts,"NextNotePage");
    
  },
  Status: function($,window){
    var surs = [];
    $(".status-container h4 span").each(function(i,span){
      surs.push({ surveyTitle: $.trim( $(span).text() ), attempts: [] });
    });

    $(".status-container table tbody").each(function(i,tbod){
      
      $("tr",tbod).each(function(j,tr){
        var dateCompleted = $.trim( $("td[data-title='Date Completed']",tr).text() );
        if ( ""==dateCompleted ){
          return;
        }

        var row = { };
        $("td",tr).each(function(idx, td){
          if ($("div",td).length){
             var div = $("div",td);
             var val = $.trim( div.text() );
             if ( val=="--" || val=="N/A" || val=="" ) return;


             row[ div.data("original-title").replace(/\./g,"_") ] = {
              qtxt : div.data("content"),
              val : val
             }
          }
          else if ($("a",td).length){
             var val = $.trim( $("a",td).text() );
             if ( val=="--" || val=="N/A" || val=="" ) return;
             row[ $(td).data("title").replace(/\./g,"_") ] = val;
          }
          else {
             var val = $.trim( $(td).text() );
             if ( val=="--" || val=="N/A" || val=="" ) return;
             row[ $(td).data("title").replace(/\./g,"_") ] = val; 
          }
        })
        //console.log("\n", row);
        surs[i].attempts.push( row );
      })
    });
    
    currentPatient.surveys = surs;
    var nextUrl = "/med";
    var opts = {
      jar: j, 
      url: basePath+nextUrl,
      headers: headers
    };
    window.close();
    return reqPage(opts,"Med");
  },

  Med: function($,window){
    var cellTxt = $.trim( $("#table_medications tbody tr td").html() );
    console.log(cellTxt);
    if (  cellTxt != 'No current medications on file.' ){
      console.log("GOT MEDICATIONS");
      currentPatient.hasMeds = true;
    }

    var nextUrl = "/supply";
    var opts = {
      jar: j, 
      url: basePath+nextUrl,
      headers: headers
    };
    window.close();
    return reqPage(opts,"Supplies");
  },
  Supplies: function($,window){
    var cellTxt = $("#table_supplies tbody tr td").html()
    if ( $.trim( cellTxt ) != 'No current supplies on file.' ){
      console.log("GOT supplies");
      currentPatient.hasSupplies = true;
    }
    else console.log(cellTxt);

    window.close();
    return nextPatient(currentPatient);  
  }
}

MC.connect( "mongodb://localhost:27017/healthcall" )
.then(function(dbConn){
  db.pdb = dbConn;
  db.coll = dbConn.collection("patients");

  console.log(db.test);
  return fs.readFileAsync("/var/data/hc/niv3.json")
})
.then(parse)
.catch(function(err){
  console.log(err);
});
