/// <reference path="lib/jquery/jquery.d.ts" />
/// <reference path="lib/d3/d3.d.ts" />
/// <reference path="lib/leaflet/leaflet.d.ts" />
/// <reference path="lib/leaflet/d3svgoverlay/L.D3SvgOverlay.d.ts" />
/// <reference path="common.ts" />
var app;
$(function () {
    app = new App();
    app.init();
    //app.hurricaneData.load("data/hurdat2-atlantic-lite.csv");
    //app.hurricaneData.load("data/hurdat2-pacific-lite.csv");
    app.hurricaneData.load("data/hurdat2-lite.json");
    // Set selection to first five hurricanes 
    // It's convoluted because this needs to executed once the data is loaded. And then
    // we also want to remove the listener (on hurricaneData) once the selection is made.
    var setSelection = function () {
        if (app.hurricaneData.Hurricanes.length > 5 && app.hurricaneSelection.Value.length == 0) {
            app.hurricaneSelection.Value = app.hurricaneData.Hurricanes.slice(0, 5);
            app.hurricaneData.Changed.off(setSelection);
        }
    };
    app.hurricaneData.Changed.on(setSelection);
});
var App = (function () {
    function App() {
    }
    App.prototype.init = function () {
        this.hurricaneData = new HurricaneData();
        this.hurricaneSelection = new HurricaneSelection();
        this.hurricaneList = new HurricaneList();
        this.hurricaneMap = new HurricaneMap();
        this.hurricaneCountGraph = new HurricaneCountGraph();
        this.hurricaneIntensityGraph = new HurricaneIntensityGraph();
    };
    return App;
})();
var HurricaneData = (function () {
    function HurricaneData() {
        this.hurricanes = new Array();
        this.onChanged = new common.LiteEvent();
    }
    Object.defineProperty(HurricaneData.prototype, "Changed", {
        get: function () { return this.onChanged; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HurricaneData.prototype, "Hurricanes", {
        get: function () { return this.hurricanes; },
        enumerable: true,
        configurable: true
    });
    HurricaneData.prototype.load = function (path) {
        var _this = this;
        var addData = function (data) {
            _this.hurricanes = _this.hurricanes.concat(data);
            _this.onChanged.trigger();
        };
        if (/^.*\.json$/.test(path)) {
            d3.json(path, function (err, data) {
                addData(data);
            });
        }
        else {
            HurricaneData.loadHurdat(path, addData);
        }
    };
    HurricaneData.loadHurdat = function (path, onLoad) {
        function capitalize(s) {
            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        }
        function nuller(val) {
            return (val === -999 || val === -99) ? null : val;
        }
        function parseLatLng(x) {
            var negate = false;
            if (x.indexOf("S") !== -1 || x.indexOf("W") !== -1)
                negate = true;
            x = +x.replace(/[NSWEnswe]/g, "");
            if (negate)
                x = -x;
            return x;
        }
        function parseDate(x, y) {
            var year = x.substr(0, 4);
            var month = x.substr(4, 2);
            var day = x.substr(6, 2);
            var hour = Math.floor(y / 100);
            var minute = y % 100;
            return Date.UTC(year, month, day, hour, minute, 0, 0);
        }
        function parseTrack(row) {
            var track = new HurricaneData.TrackPoint();
            track.date = parseDate(row[0], +row[1]);
            track.recordIdentifier = row[2];
            track.systemStatus = row[3].trim();
            track.coordinates = [parseLatLng(row[4]), parseLatLng(row[5])];
            track.maxWindSpeed = nuller(+row[6]);
            track.minPressure = nuller(+row[7]);
            track.radii = (function () {
                var radii = new HurricaneData.Radii();
                radii.kt34 = [+row[8], +row[9], +row[10], +row[11]].map(nuller);
                radii.kt50 = [+row[12], +row[13], +row[14], +row[15]].map(nuller);
                radii.kt64 = [+row[16], +row[17], +row[18], +row[19]].map(nuller);
                return radii;
            })();
            return track;
        }
        function parseHurdat(rows) {
            var hurricanes = [];
            for (var i = 0; i < rows.length;) {
                var row = rows[i];
                var hurricane = new HurricaneData.Hurricane();
                hurricane.basin = row[0].substring(0, 2);
                hurricane.cycloneNumber = +row[0].substring(2, 4);
                hurricane.year = +row[0].substring(4, 8);
                hurricane.name = capitalize(row[1].trim());
                var numEntries = +row[2];
                i++;
                hurricane.track = new Array();
                for (var j = 0; j < numEntries; j++)
                    hurricane.track[j] = parseTrack(rows[i + j]);
                i += numEntries;
                hurricanes.push(hurricane);
            }
            return hurricanes;
        }
        d3.text(path, function (text) {
            var rows = d3.csv.parseRows(text);
            onLoad(parseHurdat(rows));
        });
    };
    return HurricaneData;
})();
var HurricaneSelection = (function () {
    function HurricaneSelection() {
        this.onChanged = new common.LiteEvent();
        this.value = new Array();
    }
    Object.defineProperty(HurricaneSelection.prototype, "Changed", {
        get: function () {
            return this.onChanged;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HurricaneSelection.prototype, "Value", {
        get: function () { return this.value; },
        set: function (v) { this.value = v; this.onChanged.trigger(); },
        enumerable: true,
        configurable: true
    });
    return HurricaneSelection;
})();
// Static nested classes inside HurricaneData
var HurricaneData;
(function (HurricaneData) {
    var Hurricane = (function () {
        function Hurricane() {
        }
        return Hurricane;
    })();
    HurricaneData.Hurricane = Hurricane;
    var TrackPoint = (function () {
        function TrackPoint() {
        }
        return TrackPoint;
    })();
    HurricaneData.TrackPoint = TrackPoint;
    var Radii = (function () {
        function Radii() {
        }
        return Radii;
    })();
    HurricaneData.Radii = Radii;
})(HurricaneData || (HurricaneData = {}));
var HurricaneList = (function () {
    function HurricaneList() {
        this.initUI();
    }
    HurricaneList.prototype.initUI = function () {
        var listBox = $("#HurricaneList [name=body]")
            .append("select").addClass("hurricaneSelect").attr("multiple", "true");
        app.hurricaneData.Changed.on(function () {
            d3.select("#HurricaneList [name=body] select.hurricaneSelect")
                .selectAll("option")
                .data(app.hurricaneData.Hurricanes)
                .enter()
                .append("option")
                .attr("value", function (d) { return d.name; })
                .datum(function (d) { return d; })
                .text(function (d) { return d.name; });
        });
        /*listBox.change((evt) => {
            let list = new Array<HurricaneData.Hurricane>();
            $("#HurricaneList [name=body] select.hurricaneSelect option:selected").each((i, elem) => {
                list.push(d3.select(elem).datum());
            });
            app.hurricaneSelection.Value = list;
        });*/
    };
    return HurricaneList;
})();
var HurricaneMap = (function () {
    function HurricaneMap() {
        this.pane = { svg: null, g: null };
        this.initUI();
    }
    HurricaneMap.prototype.initUI = function () {
        var southWest = L.latLng(-200, -90), northEast = L.latLng(100, 90), bounds = L.latLngBounds(southWest, northEast);
        var map = L.map("HurricaneMap").setView([35, -100], 2);
        /*L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);*/
        L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: ['a', 'b', 'c', 'd'],
            maxZoom: 19,
            minZoom: 2,
            bounds: bounds
        }).addTo(map);
        this.map = map;
        var d3Overlay = L.d3SvgOverlay(function (selection, projection) {
            selection.selectAll("circle")
                .data(app.hurricaneSelection.Value)
                .attr("cx", function (d) { return projection.latLngToLayerPoint(d.track[0].coordinates).x; })
                .attr("cy", function (d) { return projection.latLngToLayerPoint(d.track[0].coordinates).y; })
                .enter()
                .append("circle")
                .attr("r", 1)
                .attr("fill", "red");
            //var updateSelection = selection.selectAll('circle').data(dataset);
            //updateSelection.enter()
            //   .append('circle')
            //  .attr("cx", function (d) { return projection.latLngToLayerPoint(d.latLng).x; })
            // .attr("cy", function (d) { return projection.latLngToLayerPoint(d.latLng).y; });
        });
        d3Overlay.addTo(map);
        app.hurricaneSelection.Changed.on(function () {
            d3Overlay.draw();
        });
    };
    return HurricaneMap;
})();
var HurricaneCountGraph = (function () {
    function HurricaneCountGraph() {
        this.initUI();
    }
    HurricaneCountGraph.prototype.initUI = function () {
        // count hurricanes per year
        var hurPerYearAtlantic = countYears(app.hurricaneData.Hurricanes, "AL");
        var hurPerYearPacific = countYears(app.hurricaneData.Hurricanes, "EP");
        //testing:
        //var hurPerYearAtlantic = [5, 10, 15];
        // create bar chart by passing this array
        barChart(".atlantic", hurPerYearAtlantic);
        barChart(".pacific", hurPerYearPacific);
        function barChart(chartSpace, yearData) {
            if (yearData === void 0) { yearData = []; }
            var margin = { top: 20, right: 20, bottom: 30, left: 40 }, width = 960 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;
            var x = d3.scale.ordinal()
                .domain(yearData.map(function (d) { return d.year; }))
                .rangeRoundBands([0, width], .1);
            var y = d3.scale.linear()
                .domain([0, d3.max(yearData, function (d) { return d.count; }) + d3.min(yearData, function (d) { return d.count; })])
                .range([height, 0]);
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");
            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(10);
            var svg = d3.select(chartSpace).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            var barWidth = width / yearData.length;
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");
            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);
            svg.selectAll(".bar") //FIX THIS ALL
                .data(yearData)
                .enter().append("rect")
                .attr("x", function (d) {
                return x(d.year);
            })
                .attr("y", function (d) {
                return y(d.count);
            })
                .attr("height", function (d) {
                return height - y(d.count);
            })
                .attr("width", x.rangeBand());
        }
        /*var data = [4, 8, 15, 16, 23, 42];

        var x = d3.scale.linear()
            .domain([0, d3.max(data)])
            .range([0, 420]);

        d3.select(".chart")
            .selectAll("div")
            .data(data)
            .enter().append("div")
            .style("width", function (d) { return x(d) + "px"; })
            .text(function (d) { return d; });

        }*/
        function countYears(ds, basin) {
            var yearCounts = []; // static since we have data from 1871 - 2015
            for (var i = 1851; i <= 2014; i++) {
                yearCounts.push({
                    year: i,
                    count: 0
                });
            }
            for (var i = 0; i < ds.length; i++) {
                if (basin == ds[i].basin) {
                    yearCounts[ds[i].year - 1871].count++;
                }
            }
            return yearCounts;
        }
    };
    return HurricaneCountGraph;
})();
var HurricaneIntensityGraph = (function () {
    function HurricaneIntensityGraph() {
    }
    return HurricaneIntensityGraph;
})();
//# sourceMappingURL=app.js.map