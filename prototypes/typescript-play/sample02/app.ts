/// <reference path="jquery.d.ts"/>
/// <reference path="d3.d.ts"/>

$(function() {
    let svg = d3.select("#app")
        .append("svg")
        .attr("width", 50)
        .attr("height", 50);
        
    let data = new Array(10);
        
    function updateBar(t : number) {
        function height(i : number) : number {
            return i * 5 + 3 * (1 + 1.2 * Math.sin(-i * 1.5  + t * 0.15));
        }
        svg.selectAll("rect")
            .data(data)
            .attr("y", (d, i) => 50 - height(i))
            .attr("height", (d,i) => height(i))
            .attr("fill", "blue")
            .enter()
            .append("rect")
            .attr({"x": (d, i) => i * 5, "width": 4});            
    }

    let t = 0;
    window.setInterval(function() {
        updateBar(t++);
    }, 10);
});
