var fs = require('fs')
    , turf = require("turf")
    , csv = require("fast-csv")
    , gmaps = require('googlemaps'),

    polyline = require('polyline')
    , Promise = require('es6-promise').Promise;

var publicConfig = {
    key: 'AIzaSyDCWQQNIQCNoLaQgQi6vphN4IIZIupoJ2M'
    , stagger_time: 1000
    , encode_polylines: false
    , secure: true
, };

gmaps.config(publicConfig);

var dataIn = [];

csv.fromPath('trips.csv', {
        headers: true
    })
    .on('data', function (data) {
        dataIn.push(data);
    })
    .on('end', function () {
        processData(dataIn);
    });

function processData(dataIn) {

    var promises = [];

    // map all the data and store as promise
    dataIn.map(function (d) {

        var promise = findRoute(d.TO, d.FROM, d.YEAR, d.COMMENT);

        // push to array
        promises.push(promise);

        function f() {
            console.log('Running 1 second Timeout');
        }
        setTimeout(f, 1000);



    });

    // when all the promises are ready
    Promise.all(promises).then(function (features) {

        function f() {
            console.log('Running 1 second Timeout');
        }
        setTimeout(f, 1000);


        //write all the polylines to a feature collection
        var fc = turf.featureCollection(features);

        // write the featurecollection to file
        fs.writeFile('geojson/routes.json', JSON.stringify(fc));

    }).catch(function (err) {
        console.log(err);
    })
}

function findRoute(origin, destination, year, comment) {
    function f() {
        console.log('Running 1 second Timeout');
    }
    setTimeout(f, 1000);



    return new Promise(function (resolve, reject) {

        function f() {
            console.log('Running 1 second Timeout');
        }
        setTimeout(f, 1000);

        gmaps.directions(origin, destination, function (err, data) {
            if (err) throw err;


            // decode the cryptic google result

            function f() {
                console.log('Running 1 second Timeout');
            }
            setTimeout(f, 1000);

            var points = polyline.decode(data.routes[0].overview_polyline.points);

            // need to swap lng and lat positions for GeoJSON
            var pointsCoordsReversed = [];

            points.forEach(function (coords) {
                pointsCoordsReversed.push([coords[1], coords[0]]);
            })

            // shortcut for leg info
            var legs = data.routes[0].legs[0];

            // add starting point
            pointsCoordsReversed.unshift([legs.start_location.lng








                
                , legs.start_location.lat]);

            // add ending point
            pointsCoordsReversed.push([legs.end_location.lng, legs.end_location.lat]);

            // create a linestring and add properties
            var line = turf.lineString(pointsCoordsReversed, {
                start: legs.start_address
                , end: legs.end_address
                , year: year
                , comment: comment
            });

            if (line) {
                resolve(line)
            } else {
                reject(Error("pooched"));
            }

        }); // end gmaps.directions

    }); // end promise

}