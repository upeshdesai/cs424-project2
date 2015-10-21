/// <reference path="lib/jquery/jquery.d.ts" />
/// <reference path="lib/d3/d3.d.ts" />
/// <reference path="lib/leaflet/leaflet.d.ts" />
/// <reference path="common.ts" />
var app;
$(function () { app = new App(); app.init(); });
var App = (function () {
    function App() {
    }
    App.prototype.init = function () {
        this.hurricaneData = new HurricaneData();
        this.hurricaneList = new HurricaneList();
        this.hurricaneMap = new HurricaneMap();
        this.hurricaneCountGraph = new HurricaneCountGraph();
        this.hurricaneIntensityGraph = new HurricaneIntensityGraph();
    };
    return App;
})();
var HurricaneData = (function () {
    function HurricaneData() {
        var _this = this;
        this.hurricanes = new Array();
        this.onChanged = new common.LiteEvent();
        var addData = function (data) {
            _this.hurricanes = _this.hurricanes.concat(data);
            _this.onChanged.trigger();
        };
        HurricaneData.loadHurdat("data/hurdat2-atlantic.csv", addData);
        HurricaneData.loadHurdat("data/hurdat2-pacific.csv", addData);
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
    HurricaneData.loadHurdat = function (path, onLoad) {
        function capitalize(s) {
            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        }
        function nuller(val) {
            return val === -999 ? null : val;
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
        var listBox = d3.select("#HurricaneList [name=body]")
            .append("select").attr("multiple", "true");
        app.hurricaneData.Changed.on(function () {
            listBox
                .selectAll("option")
                .data(app.hurricaneData.Hurricanes)
                .enter()
                .append("option")
                .attr("value", function (d) { return d.name; })
                .text(function (d) { return d.name; });
        });
    };
    return HurricaneList;
})();
var HurricaneMap = (function () {
    function HurricaneMap() {
        this.initUI();
    }
    HurricaneMap.prototype.initUI = function () {
        var map = L.map("HurricaneMap").setView([51.5, -0.09], 13);
        /*L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);*/
        L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: ['a', 'b', 'c', 'd'],
            maxZoom: 19
        }).addTo(map);
    };
    return HurricaneMap;
})();
var HurricaneCountGraph = (function () {
    function HurricaneCountGraph() {
        this.initUI();
    }
    HurricaneCountGraph.prototype.initUI = function () {
        // count hurricanes per year
        var hurPerYearAtlantic = countYears(app.hurricaneData.Hurricanes, "Atlantic");
        var hurPerYearPacific = countYears(app.hurricaneData.Hurricanes, "Pacific");
        // create bar chart by passing this array
        barChart(hurPerYearAtlantic, ".atlantic");
        barChart(hurPerYearPacific, ".pacific");
        function barChart(yearData, chartSpace) {
            var margin = { top: 20, right: 20, bottom: 30, left: 40 }, width = 960 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;
            var x = d3.scale.linear()
                .range([0, width]);
            var y = d3.scale.linear()
                .range([height, 0]);
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");
            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");
            var svg = d3.select(chartSpace).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            var barWidth = width / yearData.length;
            x.domain([1871, 2015]);
            y.domain([0, yearData]);
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);
            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Frequency");
            svg.selectAll(".bar") //FIX THIS ALL
                .data(yearData)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("width", barWidth);
            //.attr("y", function (d) { return y(d.value); })
            //.attr("height", function (d) { return height - y(d.value); });
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
            var yearCounts = new Array(145); // static since we have data from 1871 - 2015
            for (var i = 0; i < 145; i++) {
                yearCounts[i] = 0;
            }
            for (var i = 0; i <= ds.length; i++) {
                if (ds[i].basin == basin) {
                    yearCounts[ds[i].year - 1871] += 1;
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