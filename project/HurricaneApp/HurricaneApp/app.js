/// <reference path="lib/jquery/jquery.d.ts" />
/// <reference path="lib/d3/d3.d.ts" />
/// <reference path="lib/leaflet/leaflet.d.ts" />
$(function () { new App(); });
var App = (function () {
    function App() {
        this.hurricaneList = new HurricaneList();
        this.hurricaneMap = new HurricaneMap();
        this.hurricaneCountGraph = new HurricaneCountGraph();
        this.HurricaneIntensityGraph = new HurricaneIntensityGraph();
    }
    return App;
})();
var HurricaneList = (function () {
    function HurricaneList() {
    }
    return HurricaneList;
})();
var HurricaneMap = (function () {
    function HurricaneMap() {
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
    return HurricaneMap;
})();
var HurricaneCountGraph = (function () {
    function HurricaneCountGraph() {
    }
    return HurricaneCountGraph;
})();
var HurricaneIntensityGraph = (function () {
    function HurricaneIntensityGraph() {
    }
    return HurricaneIntensityGraph;
})();
//# sourceMappingURL=app.js.map