String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

function loadHurdat(path, onLoad) {
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

    function parseTrack(row) {
        var track = {};
        track.date = row[0];
        track.time = +row[1];
        track.recordIdentifier = row[2];
        track.systemStatus = row[3].trim();
        track.coordinates = [parseLatLng(row[4]), parseLatLng(row[5])];
        track.maxWindSpeed = nuller(+row[6]);
        track.minPressure = nuller(+row[7]);
        track.radii = {
            34: [+row[8], +row[9], +row[10], +row[11]].map(nuller),
            50: [+row[12], +row[13], +row[14], +row[15]].map(nuller),
            64: [+row[16], +row[17], +row[18], +row[19]].map(nuller),
        };
        return track;
    }

    function parseHurdat(rows) {
        var hurricanes = [];
        for (var i = 0; i < rows.length;) {
            var row = rows[i];

            var hurricane = {};
            hurricane.basin = row[0].substring(0, 2);
            hurricane.cycloneNumber = +row[0].substring(2, 4);
            hurricane.year = +row[0].substring(4, 8);
            hurricane.name = row[1].trim().capitalize();
            var numEntries = +row[2];
            i++;

            hurricane.track = [];
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