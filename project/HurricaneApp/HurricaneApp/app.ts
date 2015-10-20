﻿/// <reference path="lib/jquery/jquery.d.ts" />
/// <reference path="lib/d3/d3.d.ts" />
/// <reference path="lib/leaflet/leaflet.d.ts" />
/// <reference path="common.ts" />

var app: App;
$(() => { app = new App(); app.init(); });

class App {
    public hurricaneData: HurricaneData;
    public hurricaneList: HurricaneList;
    public hurricaneMap: HurricaneMap;
    public hurricaneCountGraph: HurricaneCountGraph;
    public hurricaneIntensityGraph: HurricaneIntensityGraph;

    public constructor() {
    }

    public init() {
        this.hurricaneData = new HurricaneData();
        this.hurricaneList = new HurricaneList();
        this.hurricaneMap = new HurricaneMap();
        this.hurricaneCountGraph = new HurricaneCountGraph();
        this.hurricaneIntensityGraph = new HurricaneIntensityGraph();
    }
}

class HurricaneData {
    private hurricanes: HurricaneData.Hurricane[] = new Array<HurricaneData.Hurricane>();
    private onChanged = new common.LiteEvent<void>();

    constructor() {
        let addData = (data) => {
            this.hurricanes = this.hurricanes.concat(data);
            this.onChanged.trigger();
        };
        HurricaneData.loadHurdat("data/hurdat2-atlantic.csv", addData);
        HurricaneData.loadHurdat("data/hurdat2-pacific.csv", addData);
    }

    public get Changed(): common.ILiteEvent<void> { return this.onChanged; }
    public get Hurricanes(): HurricaneData.Hurricane[] { return this.hurricanes; }

    private static loadHurdat(path: string, onLoad: (data: HurricaneData.Hurricane[]) => void): void {
        function capitalize(s: string): string {
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
            if (negate) x = -x;
            return x;
        }

        function parseDate(x, y) : number {
            var year = x.substr(0, 4);
            var month = x.substr(4, 2);
            var day = x.substr(6, 2);
            var hour = Math.floor(y / 100);
            var minute = y % 100;
            return Date.UTC(year, month, day, hour, minute, 0, 0);
        }

        function parseTrack(row): HurricaneData.TrackPoint {
            var track = new HurricaneData.TrackPoint();
            track.date = parseDate(row[0], +row[1]);
            track.recordIdentifier = row[2];
            track.systemStatus = row[3].trim();
            track.coordinates = [parseLatLng(row[4]), parseLatLng(row[5])];
            track.maxWindSpeed = nuller(+row[6]);
            track.minPressure = nuller(+row[7]);
            track.radii = (() => {
                let radii = new HurricaneData.Radii();
                radii.kt34 = [+row[8], +row[9], +row[10], +row[11]].map(nuller);
                radii.kt50 = [+row[12], +row[13], +row[14], +row[15]].map(nuller);
                radii.kt64 = [+row[16], +row[17], +row[18], +row[19]].map(nuller);
                return radii;
            })();
            return track;
        }

        function parseHurdat(rows : string[][]): HurricaneData.Hurricane[] {
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

                hurricane.track = new Array<HurricaneData.TrackPoint>();
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
    }
}

// Static nested classes inside HurricaneData
module HurricaneData {
    export class Hurricane {
        basin: string;
        cycloneNumber: number;
        year: number;
        name: string;
        track: TrackPoint[];
    }

    export class TrackPoint {
        date: number; // UTC number. Convert to date with Date.UTC(n).
        recordIdentifier: string;
        systemStatus: string;
        coordinates: [number, number];
        maxWindSpeed: number;
        minPressure: number;
        radii: Radii;
    }

    export class Radii {
        kt34: number[];
        kt50: number[];
        kt64: number[];
    }
}

class HurricaneList {
    constructor() {
        this.initUI();
    }

    private initUI(): void {
        var listBox = d3.select("#HurricaneList [name=body]")
            .append("select").attr("multiple", "true");
        app.hurricaneData.Changed.on(() => {
            listBox
                .selectAll("option")
                .data(app.hurricaneData.Hurricanes)
                .enter()
                .append("option")
                .attr("value", (d) => { return d.name; })
                .text((d) => { return d.name; });
        });
    }
}

class HurricaneMap {
    constructor() {
        this.initUI();
    }

    private initUI() {
        var map = L.map("HurricaneMap").setView([51.5, -0.09], 13);
        /*L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);*/
        L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: ['a', 'b', 'c', 'd'],
            maxZoom: 19
        }).addTo(map);
    }
}

class HurricaneCountGraph {
    constructor() {
        this.initUI();
    }

    private initUI() {
        // count hurricanes per year
        /*var hurPerYear = countYears(app.hurricaneData.Hurricanes);

        // create bar chart by passing this array
        barChart(hurPerYear);

        function barChart(yearData) {
            var margin = { top: 20, right: 20, bottom: 30, left: 40 },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

            var x = d3.scale.linear()
                .rangeRound([0, width]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")

            var svg = d3.select("atlanticChart").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var barWidth = width / yearData.length;
            
            x.domain([1871,2015]);
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

            svg.selectAll(".bar")
                .data(yearData)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function (d) { return x(d.letter); })
                .attr("width", barWidth)
                .attr("y", function (d) { return y(yearData); })
                .attr("height", function (d) { return y(d) });
       
            */
        var data = [4, 8, 15, 16, 23, 42];

        var x = d3.scale.linear()
            .domain([0, d3.max(data)])
            .range([0, 420]);

        d3.select(".chart")
            .selectAll("div")
            .data(data)
            .enter().append("div")
            .style("width", function (d) { return x(d) + "px"; })
            .text(function (d) { return d; });

        }
    /*
        public countYears(d) { // helper function to count hurricanes per year
            var yearCounts = new Array(145); // static since we have data from 1871 - 2015
            for (var i = 0; i < 145; i++) {
                yearCounts[i] = 0;
            }

            for (var i = 0; i <= d.length; i++) {

                yearCounts[d[i].year - 1871] += 1;

            }

            return yearCounts;

        } */
    }



class HurricaneIntensityGraph {
}

