$(document).ready( function () {

  var pairSelect = $("#pairs");
  var chart;
  var chart2;
  var firstPair = 0;
  var baseurl = "https://pure-everglades-1286.herokuapp.com";
  var graph;
  var graphType = "ohlc";
  var maxCandlesticks = 250;
  var chartData = [];

  FastClick.attach(document.body);

  // process the successfully retrieved currency pairs from the ajax call
  function loadPairs( data ) {
    var x = document.getElementById("pairs");
    for (var i = 0; i < data.length; i++) {
      var option = document.createElement("option");
      option.text = data[i]["name"];
      option.value = data[i]["id"];
      if ( i == 0 ) {
        firstPair = data[i]["id"]
      }
      x.add(option);
    };

    var myselect = $("select");
      myselect[0].selectedIndex = 0;
      myselect.selectmenu("refresh");

    // document.getElementById('pairs').value = data[0]["name"]
    var location = baseurl + "/currency_pairs/" + firstPair + "/price_histories.json";

    $.ajax({
      type: "GET",
      dataType: "json",
      url: location,
      success: buildChart
    });

  }

  // get the currency pairs from the server
  $.ajax({
    type: "GET",
    dataType: "json",
    url: baseurl + "/currency_pairs/list.json",
    success: loadPairs
  });


  // set the change event for the selected currency
  $(document).on("change", "select", function(event){

    event.preventDefault();
    chartData = [];
    $("#title").text(event.currentTarget.item(event.target.selectedIndex).text);
    var location = baseurl + "/currency_pairs/" + event.target.value + "/price_histories.json";
    $.ajax({
      type: "GET",
      dataType: "json",
      url: location,
      success: buildChart
    });
  });


  function buildChart( data ) {

    // split data string into array
    var count = 0
    var hInitialDate = ""
    var hFinishDate = ""
    var hInitialVal = 0
    var hFinishVal = 0

    var lInitialDate = null
    var lFinishDate = null
    var lInitialVal = 0
    var lFinishVal = 0

    var trendlineColor = "#CC0000"

    jQuery.each( data, function (i, val) {
      if (count <= 250) {
        count++
        dataObj = { date: new Date(val["trading_date"]),
            open: Number(val["open"]),
            high: Number(val["high"]),
            low: Number(val["low"]),
            close: Number(val["close"]),
            adx: Number(val["adx"])
            }


        if ( val["three_day_high"] == true ) {
          hInitialDate = hFinishDate;
          hInitialVal  = hFinishVal;
          hFinishDate = new Date(val["trading_date"])
          hFinishVal = Number(val["high"])
          if ( hInitialVal > 0 ) {
            dataObj["bullet"] = "round"
            dataObj["description"] = "new high"
            dataObj["high3day"] = hFinishVal
          }
        }

        if ( val["three_day_low"] == true ) {
          lInitialDate = lFinishDate;
          lInitialVal  = lFinishVal;
          lFinishDate = new Date(val["trading_date"])
          lFinishVal = Number(val["low"])
          if ( lInitialVal > 0 ) {
            dataObj["bullet"] = "round"
            dataObj["description"] = "new low"
            dataObj["low3day"] = lFinishVal
          }
        }

        chartData.push(dataObj);

      };

    });

    // SERIAL CHART
    chart = new AmCharts.AmSerialChart();
    // chart.pathToImages = "./amcharts/images/";
    chart.pathToImages = "js/amcharts/images/";
    chart.dataProvider = chartData;
    chart.categoryField = "date";
    chart.theme = "none"
    // listen for dataUpdated event ad call "zoom" method then it happens
    chart.addListener('dataUpdated', zoomChart);
    // listen for zoomed event andcall "handleZoom" method then it happens
    chart.addListener('zoomed', handleZoom);

    // AXES
    // category
    var categoryAxis = chart.categoryAxis;
    categoryAxis.parseDates = true; // as our data is date-based, we set this to true
    // categoryAxis.labelRotation = 65;

    // value
    var valueAxis = new AmCharts.ValueAxis();
    valueAxis.position = "left"
    chart.addValueAxis(valueAxis);

    // add trendlines
    //chart.trendLines = hTrend.concat(lTrend)

    // GRAPH
    graph = new AmCharts.AmGraph();
    graph.balloonText = "Open:<b>[[open]]</b><br>Low:<b>[[low]]</b><br>High:<b>[[high]]</b><br>Close:<b>[[close]]</b><br>";
    //graph.showBalloon = false;
    graph.title = "Price:";
    graph.type = "ohlc";
    // graph colors
    graph.lineColor = "#7f8da9";
    graph.fillColors = "#7f8da9";
    graph.negativeLineColor = "#db4c3c";
    graph.negativeFillColors = "#db4c3c";
    graph.fillAlphas = 0;
    graph.lineAlpha = 1;
    // candlestick graph has 4 fields - open, low, high, close
    graph.openField = "open";
    graph.highField = "high";
    graph.lowField = "low";
    graph.closeField = "close";
    // this one is for "line" graph type
    graph.valueField = "close";
    //graph.bullet = "round";
    chart.addGraph(graph);

    // add another graph
    var graph2 = new AmCharts.AmGraph();
    graph2.type = "line";
    graph2.balloonText = "3-bar high:<b>[[value]]</b>"
    graph2.bullet = "round";
    graph2.bulletSize = 5;
    graph2.lineAlpha = 1;
    graph2.valueField = "high3day";
    graph2.lineColor = '#A80000';
    graph2.negativeLineColor = "#db4c3c";
    chart.addGraph(graph2);

    // add another graph
    var graph3 = new AmCharts.AmGraph();
    graph3.type = "line";
    graph3.balloonText = "3-bar low:<b>[[value]]</b>"
    graph3.bullet = "round";
    graph3.bulletSize = 5;
    graph3.lineAlpha = 1;
    graph3.valueField = "low3day";
    graph3.lineColor = '#A80000';
    graph3.negativeLineColor = "#db4c3c";
    chart.addGraph(graph3);


    // CURSOR
    var chartCursor = new AmCharts.ChartCursor();
    chart.addChartCursor(chartCursor);

    // SCROLLBAR
    var chartScrollbar = new AmCharts.ChartScrollbar();
    chartScrollbar.scrollbarHeight = 30;
    chartScrollbar.graph = graph; // as we want graph to be displayed in the scrollbar, we set graph here
    chartScrollbar.graphType = "line"; // we don't want candlesticks to be displayed in the scrollbar
    chart.addChartScrollbar(chartScrollbar);

    // WRITE
    chart.write("chartdiv");

    // ===================================
    chart2 = AmCharts.makeChart("chartdiv2", {
        "type": "serial",
        "theme": "none",
        "marginLeft": 20,
        "pathToImages": "js/amcharts/images/",
        "dataProvider": chartData,
        "valueAxes": [{
            "axisAlpha": 0,
            // "inside": false,
            "position": "left",
            // "ignoreAxisWidth": true
        }],
        "graphs": [{
            "balloonText": "[[date]]<br><b><span style='font-size:14px;'>[[value]]</span></b>",
            // "bullet": "round",
            // "bulletSize": 6,
            "lineColor": "#d1655d",
            "lineThickness": 2,
            "negativeLineColor": "#637bb6",
            "type": "smoothedLine",
            "valueField": "adx"
        }],
        "chartScrollbar": {
          "scrollbarHeight": 30
        },
        "chartCursor": {
            // "categoryBalloonDateFormat": "YYYY",
            // "cursorAlpha": 0,
            // "cursorPosition": "mouse"
        },
        // "dataDateFormat": "YYYY",
        "categoryField": "date",
        "categoryAxis": {
            // "minPeriod": "YYYY",
            "parseDates": true,
            "minorGridAlpha": 0.1,
            "minorGridEnabled": true
        }
    });

    // listen for dataUpdated event ad call "zoom" method then it happens
    chart2.addListener('rendered', zoomChart2);
    zoomChart2();
    // listen for zoomed event andcall "handleZoom" method then it happens
    chart2.addListener('zoomed', handleZoom);

  }



  // this method is called when chart is first inited as we listen for "dataUpdated" event
  function zoomChart() {
    // different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
    chart.zoomToIndexes(chartData.length - 20, chartData.length - 1);
  }

  // this method is called when chart is first inited as we listen for "dataUpdated" event
  function zoomChart2() {
    // different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
    chart2.zoomToIndexes(chartData.length - 20, chartData.length - 1);
  }

  // this methid is called each time the selected period of the chart is changed
  function handleZoom(event) {
    var startDate = event.startDate;
    var endDate = event.endDate;
    document.getElementById("startDate").value = AmCharts.formatDate(startDate, "DD/MM/YYYY");
    document.getElementById("endDate").value = AmCharts.formatDate(endDate, "DD/MM/YYYY");

    // as we also want to change graph type depending on the selected period, we call this method
    changeGraphType(event);
    if ( chart2 != null ) {
      chart2.zoomToDates(startDate, endDate);
    }
    chart.zoomToDates(startDate, endDate);
  }

      // changes graph type to line/candlestick, depending on the selected range
  function changeGraphType(event) {
    var startIndex = event.startIndex;
    var endIndex = event.endIndex;

    if (endIndex - startIndex > maxCandlesticks) {
      // change graph type
      if (graph.type != "line") {
        graph.type = "line";
        graph.fillAlphas = 0;
        chart.validateNow();
        chart2.validateNow();
      }
    } else {
      // change graph type
      if (graph.type != graphType) {
        graph.type = graphType;
        graph.fillAlphas = 1;
        chart.validateNow();
        chart2.validateNow();
      }
    }
  }


  // this method converts string from input fields to date object
  function stringToDate(str) {
    var dArr = str.split("/");
    var date = new Date(Number(dArr[2]), Number(dArr[1]) - 1, dArr[0]);
    return date;
  }

  // this method is called when user changes dates in the input field
  function changeZoomDates() {
    var startDateString = document.getElementById("startDate").value;
    var endDateString = document.getElementById("endDate").value;
    var startDate = stringToDate(startDateString);
    var endDate = stringToDate(endDateString);
    chart.zoomToDates(startDate, endDate);
  }
  
})
