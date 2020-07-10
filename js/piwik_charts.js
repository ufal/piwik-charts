jQuery(document).ready(function (){

    jQuery.jqplot.config.enablePlugins = true;
    
    var idCounter = 1;
    
    jQuery('div[type="piwikchart"]').each(function () {
      var chart = new PiwikChart(jQuery(this), idCounter++);
      chart.createUI();
      chart.loadContents();
    });    

});

var monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function PiwikChart (div, id) {
  this.current_view  = "year";
  this.current_year  = null;
  this.current_month = null;
  this.current_day   = null;
  this.current_date  = null;
  this.current_tab   = "views";
  this.current_year_only = false;
  this.loaded_data = {};
  this.already_loaded_dates = {};
  this.div = div;
  this.id = id;    
  this.already_loaded_dates = {"views":{}, "downloads":{}};
  this.loaded_data = {"views":{}, "downloads":{}};  
};

PiwikChart.prototype.loadContents = function () {    
  
  var _self = this;

  _self.clearDivs();

  var reportURL = _self.div.attr("data-url");
  if(reportURL.includes("?")) {
    reportURL += "&period=" + _self.current_view;
  }
  else {
    reportURL += "?period=" + _self.current_view;
  }
  
  if(_self.current_date!=null) {
      reportURL += "&date=" + _self.current_date;
  }
      
  var visitsPlot;
  var downloadPlot;           
  
  if(!(_self.current_view in _self.already_loaded_dates["views"] && _self.current_date in _self.already_loaded_dates["views"][_self.current_view])) {
      jQuery.getJSON(reportURL, function(data) {
          _self.loaded_data["views"] = jQuery.extend(true, _self.loaded_data["views"], data["response"]["views"]);
          _self.loaded_data["downloads"] = jQuery.extend(true, _self.loaded_data["downloads"], data["response"]["downloads"]);
          if(!(_self.current_view in _self.already_loaded_dates["views"])) _self.already_loaded_dates["views"][_self.current_view] = {};
          if(!(_self.current_date in _self.already_loaded_dates["views"][_self.current_view])) _self.already_loaded_dates["views"][_self.current_view][_self.current_date] = true;

          if(_self.loaded_data == null || _self.loaded_data["views"] == null || Object.keys(_self.loaded_data["views"]).length <= 1) {
              jQuery('pc-' + _self.id + '-msg').html("<div class='alert alert-info'><strong>No statistics available for this item yet.</strong></div>");
              jQuery('pc-' + _self.id + '-panels').addClass("hide");        
              jQuery('pc-' + _self.id + '-msg').removeClass("hide");
              return;
          } else {
            _self.plot();
          }

      })
  } else {
    _self.plot();
  }       
};

PiwikChart.prototype.clearDivs = function() {
  jQuery('#pc-' + this.id + '-viewschart').html('<div class="piwik-loading" style="width: 100%; height: 100%; z-index=1; display: none;"><i class="fa fa-pulse fa-3x" >&#xf110;</i></div>');
  jQuery('#pc-' + this.id + '-downloadschart').html('<div class="piwik-loading" style="width: 100%; height: 100%; z-index=1; display: none;"><i class="fa fa-pulse fa-3x" >&#xf110;</i></div>');  
  jQuery('#pc-' + this.id + "-views .piwik-loading").css("display", "block");  
}

PiwikChart.prototype.plot = function () {
  
  var _self = this;  
  
  var visitsPlot;
  var downloadPlot;
  
  var views = _self.loaded_data["views"]["total"];
  var downloads = _self.loaded_data["downloads"]["total"];
  var tf  = "%Y";
  var ti  = "1 year";
  
  if(_self.current_view=="month") {
      try{
          views = _self.loaded_data["views"]["total"][_self.current_year];
      }catch(e){}
      try{
          downloads = _self.loaded_data["downloads"]["total"][_self.current_year];
      }catch(e){}
      tf  = "%b";
      ti  = "1 month";                
  }
  
  if(_self.current_view=="day") {
      try{
          views = _self.loaded_data["views"]["total"][_self.current_year][_self.current_month];
      }catch(e){}
      try{
          downloads = _self.loaded_data["downloads"]["total"][_self.current_year][_self.current_month];
      }catch(e){}
      tf  = "%d";
      ti  = "1 day";              
  }
  
  if(_self.current_tab=="views") {
      visitsPlot = _self.plotViews('pc-' + _self.id + '-viewschart', views, ["#bee89c", "#60a22a"], tf, ti, "<div style='font-size: 110%; padding: 5px; color: #FFFFFF;'>%s<BR/><strong style='font-size: 14px;'>%s</strong> Views</div>");
  } else {
      downloadPlot = _self.plotViews('pc-' + _self.id + '-downloadschart', downloads, ["#94c7ea", "#1f78b4"], tf, ti, "<div style='font-size: 110%; padding: 5px; color: #FFFFFF;'>%s<BR/><strong style='font-size: 14px;'>%s</strong> Downloads</div>");
      
      if(_self.current_view == 'year') {
          var bitwiseDownloads = "<div class='container' style='margin-top: 20px;'>";
          bitwiseDownloads += "<table class='table table-striped'><thead><tr><th colspan='2'>Filewise Statistics</th></tr></thead><tbody>";           
          var years = Object.keys(_self.loaded_data["downloads"]["total"]).sort().filter(function(e) { return !e.startsWith("nb") });
          for(var year in years) {
              
              bitwiseDownloads += "<tr><td colspan='2'>" + years[year] + "</td></tr>";
              
              var temp = _self.loaded_data["downloads"][years[year]];
              temp = Object.keys(temp).filter(function(e){return e.length>2;}); 
              
              var map = {};           
              for(var key in temp) {
                  map[temp[key]] = _self.loaded_data["downloads"][years[year]][temp[key]]["nb_hits"]; 
              }
              map = sortMapByValue(map);
              for(var index in map) {
                  bitwiseDownloads += "<tr><td class='col-md-2 text-right'><strong>" + map[index][1] + "</strong></td><td>" + getBitstreamFromURL(map[index][0]) + "</td></tr>";
              }
          }
          bitwiseDownloads += "</tbody></table>";         
      } else 
      if(_self.current_view == 'month') {
          var bitwiseDownloads = "<div class='container' style='margin-top: 20px;'>";
          bitwiseDownloads += "<table class='table table-striped'><thead><tr><th colspan='2'>Filewise Statistics</th></tr></thead><tbody>";           
          
          var temp = _self.loaded_data["downloads"][_self.current_year];
          temp = Object.keys(temp).filter(function(e){return e.length>2;}); 
          
          var map = {};           
          for(var key in temp) {
              map[temp[key]] = _self.loaded_data["downloads"][_self.current_year][temp[key]]["nb_hits"]; 
          }
          map = sortMapByValue(map);
          for(var index in map) {
              bitwiseDownloads += "<tr><td class='col-md-2 text-right'><strong>" + map[index][1] + "</strong></td><td>" + getBitstreamFromURL(map[index][0]) + "</td></tr>";
          }

          
          bitwiseDownloads += "</tbody></table>";                     
      } else
      if(_self.current_view == 'day') {
          var bitwiseDownloads = "<div class='container' style='margin-top: 20px;'>";
          bitwiseDownloads += "<table class='table table-striped'><thead><tr><th colspan='2'>Filewise Statistics</th></tr></thead><tbody>";           
          
          var temp = _self.loaded_data["downloads"][_self.current_year][_self.current_month];
          if(temp) {
            temp = Object.keys(temp).filter(function(e){return e.length>2;});
          }
          
          var map = {};           
          for(var key in temp) {
              map[temp[key]] = _self.loaded_data["downloads"][_self.current_year][_self.current_month][temp[key]]["nb_hits"]; 
          }
          map = sortMapByValue(map);
          for(var index in map) {
              bitwiseDownloads += "<tr><td class='col-md-2 text-right'><strong>" + map[index][1] + "</strong></td><td>" + getBitstreamFromURL(map[index][0]) + "</td></tr>";
          }

          
          bitwiseDownloads += "</tbody></table>";                     
          
      }
      
      var bitwiseDownloadsDiv = jQuery('#pc-' + _self.id + ' .bitwiseDownloads');
      if(bitwiseDownloadsDiv.html()==null) {
        jQuery('#pc-' + this.id + '-downloads').append('<div class="bitwiseDownloads"></div>');
      }                                  
      jQuery('#pc-' + _self.id + ' .bitwiseDownloads').html(bitwiseDownloads);     
  }
  
  var t = 0;
  var d = 0;
  
  if(_self.current_view=="year") {
      try {
          t = _self.loaded_data["views"]["total"]["nb_hits"];
      }catch(e) {}
      try {
          d = _self.loaded_data["downloads"]["total"]["nb_hits"];
      }catch(e) {}
      jQuery('#pc-' + _self.id + '-views_tab_count').html("<strong>" + t + "</strong>");
      jQuery('#pc-' + _self.id + '-downloads_tab_count').html("<strong>" + d + "</strong>");
  } else 
  if(_self.current_view=="month") {
      try {
          t = _self.loaded_data["views"]["total"][_self.current_year]["nb_hits"];
      }catch(e) {}
      try {
          d = _self.loaded_data["downloads"]["total"][_self.current_year]["nb_hits"];
      }catch(e) {}
      jQuery('#pc-' + _self.id + '-views_tab_count').html("<strong>" + t + "</strong>");
      jQuery('#pc-' + _self.id + '-downloads_tab_count').html("<strong>" + d + "</strong>");              
  } else
  if(_self.current_view=="day") {
      try {
          t = _self.loaded_data["views"]["total"][_self.current_year][_self.current_month]["nb_hits"];
      }catch(e) {}
      try {
          d = _self.loaded_data["downloads"]["total"][_self.current_year][_self.current_month]["nb_hits"];
      }catch(e) {}
      jQuery('#pc-' + _self.id + '-views_tab_count').html("<strong>" + t + "</strong>");
      jQuery('#pc-' + _self.id + '-downloads_tab_count').html("<strong>" + d + "</strong>");              
  }
  
  if(_self.current_view == "year") {
      var years = Object.keys(_self.loaded_data[_self.current_tab=="views"?"views":"downloads"]["total"]).sort().filter(function(e) { return !e.startsWith("nb") });
      jQuery('#pc-' + _self.id + ' .current_span').html("Statistics for years " + years[0] + " to " + years[years.length-1]);
      jQuery('#pc-' + _self.id + ' .current_span_btn').hide();
  } else if(_self.current_view == "month") {
      jQuery('#pc-' + _self.id + ' .current_span').html("Statistics for the year " + _self.current_year);
      if(_self.current_year_only)
        jQuery('#pc-' + _self.id + ' .current_span_btn').hide();
      else
        jQuery('#pc-' + _self.id + ' .current_span_btn').show();
  } else if(_self.current_view == "day") {
      jQuery('#pc-' + _self.id + ' .current_span').html("Statistics for " + monthNames[parseInt(_self.current_month)] + ", " + _self.current_year);
      jQuery('#pc-' + _self.id + ' .current_span_btn').show();
  }
  
  jQuery(window).resize(function(){
      if(visitsPlot!=null) visitsPlot.replot();
      if(downloadPlot!=null) downloadPlot.replot();
  });    
  
  jQuery(".piwik-loading").css("display", "none");
      
};

PiwikChart.prototype.plotViews = function (div, data, color, tf, ti, highlightString) {
  
    var _self = this;  

    var ticks = [];
    
    if(_self.current_view == "year") {
        try{
            ticks = Object.keys(data)
                    .filter(function(e) { return e !== 'total' && !e.startsWith('nb') })
                    .sort(function(a,b){return parseInt(a)-parseInt(b)});
        }catch(e){
            var cy = new Date().getFullYear();
            for(var i=cy-5;i<=cy;i++) {
                ticks.push("" + i);
            }
        }
        if(ticks.length==1) {
          _self.current_view = "month";
          _self.current_year = ticks[0];          
          _self.current_date = _self.current_year;
          _self.current_year_only = true;
          _self.loadContents();
          return;
        }       
    }
    else
    if(_self.current_view == "month") {
        ticks = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    }
    else
    if(_self.current_view == "day") {
        for(i=1;i<=moment(_self.current_date, "YYYY-M").daysInMonth();i++) {
            ticks.push("" + i);
        }
    }
    
    var x = [];
    var y = [];
    var locations = {};
    for(index in ticks) {
        var tick = ticks[index];
        if(_self.current_view == "month") {
            tick = _self.current_year + "-" + tick.padStart(2, "0");
        } else
        if(_self.current_view == "day") {
            tick = _self.current_year + "-" + _self.current_month.padStart(2, "0") + "-" + tick;
        }
        x.push(tick);
        if(data != undefined && data[ticks[index]]) {
            var v = data[ticks[index]]["nb_hits"];      
            y.push([tick, v]);
        } else {
            y.push([tick, 0]);
        }
    }

    jQuery("#" + div).html("");

    var xa = {  renderer : $.jqplot.DateAxisRenderer,
                tickOptions : {formatString:tf},
                tickInterval : ti };

    if(_self.current_view == "year") {
        xa["min"] = x[0];
        xa["max"] = x[x.length-1];
    } else if(_self.current_view == "month") {
        xa["min"] = _self.current_year + "-01";
        xa["max"] = _self.current_year + "-12";
    } else if(_self.current_view == "day") {
        xa["min"] = _self.current_year + "-" + _self.current_month + "-01";
        xa["max"] = _self.current_year + "-" + _self.current_month + "-" + new Date(_self.current_year, _self.current_month, 0).getDate();
    }

    var p = $.jqplot(div, [ y, y ], {

        axes : {
            xaxis : xa,
            yaxis : {
                min : 0,
                tickOptions : {
                    formatter : _self.tickFormatter,
                }
            }
        },

        highlighter: {
            show: true,
            sizeAdjust: 7.5,
            tooltipAxes: "both",
        },

        cursor: {
            show: false,
        },

        seriesDefaults: {
            lineWidth:4,
            shadow:false,
            markerOptions: {
                size: 7
            },          
            highlighter: {formatString: highlightString},
            pointLabels: { show:false },
            breakOnNull: true
        },
        
        grid: {background: '#F0F0F0', borderWidth: 0, shadow: false},
        
        seriesColors: color,
        
        series: [{fill: [true, false]}],                

    });

    jQuery("#" + div).unbind('jqplotDataClick');

    jQuery("#" + div).bind('jqplotDataClick',
        function (ev, seriesIndex, pointIndex, d) {
            if(_self.current_view == "year") {
              _self.current_view = "month";
              _self.current_year = ticks[pointIndex];
              _self.current_date = _self.current_year;
            } else if(_self.current_view == "month") {
              _self.current_view = "day";
              _self.current_month = ticks[pointIndex];
              _self.current_date = _self.current_year + "-" + _self.current_month;
            }
            
            _self.loadContents();
        }
    );
    
    return p;
};

PiwikChart.prototype.tickFormatter = function (format, val) {
    if (val >= 1000000) {
        val = val / 1000000;
    return val.toFixed(1)+"M";
    }
    if (val >= 1000) {
        val = val / 1000;
            if (val < 10) {
                return val.toFixed(1)+"K";
            }
        return val.toFixed(1)+"K";
    }
    return val.toFixed(0);
}



PiwikChart.prototype.createUI = function() {
  
  var _self = this;
  
  var mainDiv = jQuery('<div></div>');
  var mainDivId = 'pc-' + _self.id;
  mainDiv.attr('id', mainDivId);
  
  
  var alert = jQuery('<div class="alert alert-info"></div>');
  alert.html('<i class="fa fa-info-circle">&#160;</i> Click on a data point to summarize by year / month.')
  alert.attr('id', 'pc-' + _self.id + '-alert');

  var tabs = jQuery('<ul class="nav nav-tabs" role="tablist"></ul>');
  tabs.attr('id', 'pc-' + _self.id + '-tabs');
  
  var viewTab = jQuery('<li role="presentation" class="text-center" style="min-width: 200px;"></li>');
  var viewTabLink = jQuery('<a href="#pc-' + _self.id + '-views" aria-controls="views" role="tab" data-toggle="tab" style="color: #60a22a;"  class="text-center"></a>');
  viewTabLink.append('<div class="bold text-center"><i class="fa fa-eye fa-2x">&#160;</i></div>');
  viewTabLink.append('<div>Views <span class="bold text-center" id="pc-' + _self.id + '-views_tab_count">&#160;</span></div>');
  viewTab.append(viewTabLink);
  viewTab.attr('id', 'pc-' + _self.id + '-viewbtn');
  
  var downloadTab = jQuery('<li role="presentation" class="text-center" style="min-width: 200px;"></li>');
  var downloadTabLink = jQuery('<a href="#pc-' + _self.id + '-downloads" aria-controls="downloads" role="tab" data-toggle="tab" style="color: #1f78b4;" class="text-center"></a>');
  downloadTabLink.append('<div class="bold text-center"><i class="fa fa-eye fa-2x">&#160;</i></div>');
  downloadTabLink.append('<div>Downloads <span class="bold text-center" id="pc-' + _self.id + '-downloads_tab_count">&#160;</span></div>');
  downloadTab.append(downloadTabLink);
  downloadTab.attr('id', 'pc-' + _self.id + '-downloadbtn');
  
  tabs.append(viewTab, downloadTab);
  
  var dateDiv = jQuery('<div class="pull-right" style="margin-top: 10px; margin-right: 10px;"></div>');
  dateDiv.append('<h4 style="display: inline"><span class="label label-info"><span class="current_span"></span></span></h4>')
  dateDiv.append('<a class="btn btn-xs btn-primary current_span_btn" style="display: none; margin-left: 10px;" class="btn btn-xs btn-primary"><strong>Back</strong></a>');
  
  var panels = jQuery('<div class="tab-content"></div>');
  panels.attr('id', 'pc-' + _self.id + '-panels');
  
  var viewPanel = jQuery('<div role="tabpanel" class="tab-pane" style="padding: 40px;"></div>');
  var viewChart = jQuery('<div id="pc-' + _self.id + '-viewschart" class="jqplot-target"></div>');
  viewChart.append('<div class="piwik-loading" style="width: 100%; height: 100%; display: none;"><i class="fa fa-pulse fa-3x" >&#xf110;</i></div>');
  viewPanel.attr('id', 'pc-' + _self.id + '-views');
  viewPanel.append(viewChart);
  
  var downloadPanel = jQuery('<div role="tabpanel" class="tab-pane" style="padding: 40px;"></div>');
  var downloadChart = jQuery('<div id="pc-' + _self.id + '-downloadschart" class="jqplot-target"></div>'); 
  downloadChart.append('<div class="piwik-loading" style="width: 100%; height: 100%; display: none;"><i class="fa fa-pulse fa-3x" >&#xf110;</i></div>');
  downloadPanel.attr('id', 'pc-' + _self.id + '-downloads');
  downloadPanel.append(downloadChart);
  
  panels.append(viewPanel, downloadPanel);
  
  var msgDiv = jQuery('<div class="hide"></div>');
  msgDiv.attr('id', 'pc-' + _self.id + '-msg');
  
  
  viewTab.addClass('active');
  viewPanel.addClass('active');
              
  mainDiv.append(alert, tabs, dateDiv, panels, msgDiv);
  _self.div.append(mainDiv);
  
  jQuery('#pc-' + _self.id + ' a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    _self.current_tab = e.target.getAttribute("aria-controls");
    _self.loadContents();
  });
  
  jQuery("#" + mainDivId + " .current_span_btn").click(function (){
      if(_self.current_view == "year") {
        _self.current_month = null;
        _self.current_year = null;
        _self.current_date = null;            
      } else if(_self.current_view == "month") {
        _self.current_view = "year";
        _self.current_month = null;
        _self.current_year = null;
        _self.current_date = null;
      } else if(_self.current_view == "day") {
        _self.current_view = "month";
        _self.current_date = _self.current_year;
      }
      _self.loadContents();
  });       
  
    
};

sortMapByValue = function (map){
  var tupleArray = [];
  for (var key in map) tupleArray.push([key, map[key]]);
  tupleArray.sort(function (a, b) { return b[1] - a[1] });
  return tupleArray;
}

getBitstreamFromURL = function (url) {
  var l = document.createElement("a");
  l.href = url;
  return decodeURI(l.pathname.substr(l.pathname.lastIndexOf('/') + 1));
}
