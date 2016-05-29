//set up the Papaparse (babyparse) require and set the file as my trips.csv data
var Papa = require('babyparse');
var fs = require('fs');
var file = 'trips.csv'
var content = fs.readFileSync(file, {
    encoding: 'binary'
});

Papa.parse(content, {
    download: true
    , header: true
    , complete: function (data) {
        //        console.log(data);
        processData(data);
    }
});



function processData(data) {
    
    
    for (var d in data.data) {
        
        var currentTrip = data.data[d];

        var name = currentTrip.TO + currentTrip.FROM + ".geojson";
        
        name2 = name.replace(/\s+/g, '');
        console.log(name2); //this loop is working, going through all the TO and FROM locations. however there only ever is one file output 

        var output = name2, // name of the output file
            start = currentTrip.FROM
            , end = currentTrip.TO
        comments = currentTrip.COMMENTS, // waypoints is a string with values separated by |
            waypoints = "";

        var Promise = require('es6-promise').Promise
            , googlemaps = require('googlemaps')
            , polyline = require('polyline')
            , geojson = require('geojson')
            , fs = require('fs')
            , util = require('util');

        var apiKey = fs.readFile('config-gmaps', function (err, data) {
            if (err) {
                console.error(err);
            }
            return data;
        });

        googlemaps.config({
            'AIzaSyDCWQQNIQCNoLaQgQi6vphN4IIZIupoJ2M': apiKey
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

                    var value = {
                        'lat': rawPoints[0]
                        , 'lng': rawPoints[1]
                    };

                    return normalized.push(value);

                });

                return normalized;

            }, handleError)
            // Encode the array into proper geoJSON
            .then(function (normalizedPoints) {

                var geoData = geojson.parse(normalizedPoints, {
                    Point: ['lat', 'lng']
                });

                return geoData;

            }, handleError)
            // Write out the file
            .then(function (geoData) {

                fs.writeFile('geojson/' + output, JSON.stringify(geoData, null, 2)); //why does this only create one file? It should loop through each trip.

                console.log('Successfully created file ' + output)

            }, handleError)
            .catch(handleError);

    }
}