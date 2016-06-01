//set up the Papaparse (babyparse) require and set the file as my trips.csv data
var Papa = require('babyparse')
    , fs = require('fs')
    , file = 'trips.csv'
    , content = fs.readFileSync(file, {
        encoding: 'binary'
    })
    , Promise = require('es6-promise').Promise
    , googlemaps = require('googlemaps')
    , polyline = require('polyline')
    , geojson = require('geojson')
    , util = require('util');

//var apiKey = fs.readFile('config-gmaps', function (err, data) {
//    if (err) {
//        console.error(err);
//    }
//    return data;
//});

googlemaps.config({
    //    'AIzaSyDCWQQNIQCNoLaQgQi6vphN4IIZIupoJ2M': apiKey
    key: 'AIzaSyDCWQQNIQCNoLaQgQi6vphN4IIZIupoJ2M'
});

function getGoogleRouteInformation(origin, destination, waypoints) {
    return new Promise(function (resolve, reject) {

        if (!origin || !destination) {
            console.error('Origin and destination required!')
        }

        function handleResponse(err, data) {
            if (data.status == "OK") {
                resolve(data);
            } else {
                reject('There was a problem getting the data from Google: ', err);
            }
        };

        googlemaps.directions(origin, destination, handleResponse, false, false, waypoints);
    });
}

function handleError(err) {
    console.error(err);
};


Papa.parse(content, {
    download: true
    , header: true
    , complete: function (data) {

        processData(data);
    }
});

function processData(data) {


    for (var d in data.data) {

        var currentTrip = data.data[d];

        var name = currentTrip.TO + currentTrip.FROM + ".geojson";


        var output = name.replace(/\s+/g, ''), // name of the output file
            start = currentTrip.FROM
            , end = currentTrip.TO
            , comments = currentTrip.COMMENTS
            , waypoints = "";

        findRoute(output, start, end, comments, waypoints)
        break;
    }

    function findRoute(output, start, end, comments, waypoints) {

        getGoogleRouteInformation(start, end, waypoints)
            // Decode the polyline info from Google
            .then(function (data) {

                var encodedPolyline = data.routes[0].overview_polyline
                    , decodedPolyline;

                decodedPolyline = polyline.decode(encodedPolyline.points);
            
                return decodedPolyline;
            }, handleError)
            // Convert the array of arrays into an array of objects
            .then(function (points) {

                var normalized = [];

                points.forEach(function (rawPoints) {

//                    var value = {
//                        'lat': rawPoints[0]
//                        , 'lng': rawPoints[1]
//                    };
//                    the lat/long values wont work for a linestring. Just needs to be an array of arrays
                    
                    var value = [rawPoints[0], rawPoints[1]];
                    

                    return normalized.push(value);

                });
//                console.log(normalized);
                var normalized2 = { line: normalized}
//                console.log(normalized2);
                return normalized2;

            }, handleError)
            // Encode the array into proper geoJSON
            .then(function (normalizedPoints) {
//                Note, you need to just group the array of arrays above and then output as coordinates for a LineString
            console.log(normalizedPoints)
                var geoData = geojson.parse(normalizedPoints, {
                    'MultiLineString': 'line'
                });

                return geoData;


            }, handleError)
            // Write out the file
            .then(function (geoData) {


                fs.writeFile('geojson/' + output, JSON.stringify(geoData, null, 2));
                //why does this only create one file? It should loop through each trip.

                console.log('Successfully created file ' + output)

            }, handleError)
            .catch(handleError);
    }
}