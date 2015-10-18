/// <reference path="jquery.d.ts"/>
/// <reference path="d3.d.ts"/>
$(function () {
    var svg = d3.select("#app")
        .append("svg")
        .attr("width", 50)
        .attr("height", 50);
    var data = new Array(10);
    function updateBar(t) {
        function height(i) {
            return i * 5 + 3 * (1 + 1.2 * Math.sin(-i * 1.5 + t * 0.15));
        }
        svg.selectAll("rect")
            .data(data)
            .attr("y", function (d, i) { return 50 - height(i); })
            .attr("height", function (d, i) { return height(i); })
            .attr("fill", "blue")
            .enter()
            .append("rect")
            .attr({ "x": function (d, i) { return i * 5; }, "width": 4 });
    }
    var t = 0;
    window.setInterval(function () {
        updateBar(t++);
    }, 10);
});
