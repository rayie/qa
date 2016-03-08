/*
 * First load the page into health call with max about 1000 patients
 * then copy to clipboard, then on mac os, use pbpaste > to file
 * */
var obs=[];
$("#patient_table table tbody tr").each(function(idx,rec){
  var tds = $(rec).children(); var ob={};
  $(tds).each(function(tdIdx,td){
    var k = $(td).data("title"); 
    if ( tdIdx<2 ){
      var cell = $(td).children("a");
      ob['href'] = cell.attr("href");
    }
    else{  
      var cell = $(td);
    }
    var v = cell.text()  
    ob[k]=v;
  });
  delete ob.Links;
  obs.push(ob);
});


var txtval=[];
for(var i = 0 ; i < obs.length; i++ ){ 
  txtval.push(JSON.stringify(obs[i]).replace(/\\n/g,"")); 
}
$("section.content-body").html("<textarea style='width: 300px;' id='hello'></textarea>");
$("#hello").val( "[" + txtval.join(",") +"]");

