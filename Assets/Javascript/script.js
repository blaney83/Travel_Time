
$(document).ready(function () {

    // Initialize Firebase section VVVVVVVVVVVVV
    var config = {
        apiKey: "AIzaSyBqTulegEmK-HXtVXBF1Cq_Z9OGasmKJoE",
        authDomain: "svw-project-one.firebaseapp.com",
        databaseURL: "https://svw-project-one.firebaseio.com",
        projectId: "svw-project-one",
        storageBucket: "svw-project-one.appspot.com",
        messagingSenderId: "59061588756"
    };

    firebase.initializeApp(config);

    var database = firebase.database();
    //END Initialize Firebase section ^^^^^^^^^^^^^

    //************************** */
    //VARIABLE DEFINITION SECTION
    //************************** */

    //db auth vars
    var userUID;
    var userPath;
    //END auth vars

    //input vars
    var destName;
    var destInput;
    //END input vars

    //mapping data vars
    var currentLatitude;
    var currentLongitude;
    var currentPhysicalAddress;
    var destLatitude;
    var destLongitude;
    var currentTime;
    //in hours and minutes and am/pm
    var shortArrivalTime;
    //in seconds
    var intTravTime;
    //in hours and minutes
    var parsTravTime;
    var tripDist;
    // Create a DirectionsService object to use the route method and get a result for our request
    var directionsService = new google.maps.DirectionsService();
    //holds the newly initialized asynchronous geocoder call upon init()
    var destGeocoder;
    //END mapping data vars

    //******************************* */
    //END VARIABLE DEFINITION SECTION
    //******************************* */

    //******************************* */
    // Sign-in/create account methods & functions VVVVVVVVVV
    //******************************* */

    //Creating an account
    function createAccount() {
        event.preventDefault();

        var displayID = $("#userNameEntry").val().trim();
        var email = $("#emailEntry").val().trim();
        var password = $("#passwordEntry").val().trim();

        firebase.auth().createUserWithEmailAndPassword(email, password).then(function () {
            //add the display name after the user is done being created 
            firebase.auth().currentUser.updateProfile({ displayName: displayID });
        });
    };

    //Sign-in to account
    function signInFn() {
        event.preventDefault();

        var email = $("#emailLogin").val().trim();
        var password = $("#passwordLogin").val().trim();

        firebase.auth().signInWithEmailAndPassword(email, password);
    };

    //This will auto-sign in.
    function authStateChangeListener(user) {
        var userID = firebase.auth().currentUser.displayName
        userUID = firebase.auth().currentUser.uid
        userPath = database.ref("users/" + userUID)
        //signin
        if (user) {
            //perform login operations
            event.preventDefault();
            //change login visibility
            $(".signInPage").css({ "opacity": "0" })
            $(".signInPage").css({ "z-index": "0" })

            alert("Welcome Back " + userID);
        } else {
            signout
        };
        //Calling exisitng saved destinations
        return userPath.on("child_added", function (childSnapshot) {
            console.log("listening")
            destName = childSnapshot.val().name
            destAddress = childSnapshot.val().address

            var $newDest = $("<button>").addClass("favButts").attr("id", destAddress).text(destName);


            $("#new-destinations").append($newDest);

            $("form").trigger("reset");
        }).then(
            //important to get the table and clock to generate upon page load, but after the responses return
            getTime()
        );
    };
    //************************************ */
    //END Login/Account Functions & Methods ^^^^^^^^^^^^^^^^^^^^^
    //************************************ */


    //************************************ */
    //Clock and Interval Functions & Methods VVVVVVV
    //************************************ */

    //Display Current Time  
    function getTime() {
        currentTime = moment().format("hh:mm a");
        $("#time").text(currentTime);
        tableRefresh();
    };

    //Interval Definition
    function setTime() {
        setInterval(getTime, 60000);
    };
    //************************************ */
    //END Clock and Interval Functions & Methods ^^^^^^^^
    //************************************ */

    setTime();
    //todo This is a work in progress to get saved buttons to access saved address.  Current issue is getting these buttons to run at all, due to the fact that the buttons are set up through an asychronus function, so when it comes time to run the .on("click", function) it doesn't read the buttons.  Will look into this tomorrow.  May possibly roll into Monday, because I have to work tomorrow.
    // //Will pull address from saved destination, and run to see desired time and weather.
    // $("#School").on("click", function () {
    //     event.preventDefault();

    //     console.log("test");
    //     userID = firebase.auth().currentUser.displayName
    //     userUID = firebase.auth().currentUser.uid
    //     userPath = database.ref("users/" + userUID)

    //     return userPath.on("child_added", function (childSnapshot) {
    //         destAddy = childSnapshot.val().address

    //         console.log(destAddy);

    //     });
    // });

    //Saves information for new destination
    $("#dest-btn").on("click", function (event) {
        event.preventDefault();

        var destInput = $("#dest-input").val().trim();
        var destName = $("#dest-name").val().trim();
        var newDest = {
            "name": destName,
            "address": destInput
        };

        userPath.push(newDest);

    });

    //WORKING ON MAPS/DISTANCE MATRIX API VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

    //this is the Distance Matrix API Code
    var currentLatitude;
    var currentLongitude;
    var currentPhysicalAddress;
    var destLatitude;
    var destLongitude;
    // Create a DirectionsService object to use the route method and get a result for our request
    var directionsService = new google.maps.DirectionsService();
    //run Geo initialization outright
    initGeoCode();
    //************************************ */
    //MAPS/DISTANCE Functions & Methods VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    //************************************* */

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {

            currentLatitude = position.coords.latitude;
            currentLongitude = position.coords.longitude;

            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            var geocoder = new google.maps.Geocoder();
            //once everything is set and variables defined, then we run the reverse geocoding to get our current street address VVVVVVVVVVV
            geocodeLatLng(geocoder);
        }, function () {
            //runs if they dont allow geo location
            alert("please active your geolocation services!!! turd.")
        });
    } else {
        // Browser doesn't support Geolocation
        alert("Your browser doesnt support Geolocation Services :(")
    }

    // Define calcRoute function
    function calcRoute(buttonAddress) {
        //create request
        var request = {
            origin: { lat: currentLatitude, lng: currentLongitude },
            // document.getElementById("location-1").value,
            destination: { lat: destLatitude, lng: destLongitude },
            // document.getElementById("location-2").value,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL
        }
        // Routing
        directionsService.route(request, function (result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                intTravTime = (result.routes[0].legs[0].duration.value);
                parsTravTime = (result.routes[0].legs[0].duration.text);
                tripDist = result.routes[0].legs[0].distance.text;
                var arrivalTime = moment().add(intTravTime, "s").format("dddd, MMMM Do YYYY, h:mm:ss a");
                shortArrivalTime = moment().add(intTravTime, "s").format("h:mm a");
                
                //Get distance and time amd display
                $("#trip-info-target").html("<h5>Trip Length</h5><br>Distance= " + tripDist + "<br> Duration: " + parsTravTime)
                //display arrival time
                $("#arrival-time-target").html("<h5>Arrival Time = </h5><br>" + arrivalTime)
                tableContent(buttonAddress);
                findWeather();
            } else {
                //Show error message           
                alert("Can't find road! Please try again!");
            }
        });
    }

    function initGeoCode() {
        destGeocoder = new google.maps.Geocoder();
        // console.log(navigator.geolocation)
    }

    function calculateAddressCoordinates(buttonAddress) {
        //shows user the destination currently selected
        $("#destGPS").text(buttonAddress)

        destGeocoder.geocode({ 'address': buttonAddress }, function (results, status) {
            if (status == 'OK') {
                destCoordinates = results[0].geometry.location
                destLatitude = destCoordinates.lat()
                destLongitude = destCoordinates.lng()
            } else {
                alert('Geocode was not successful. Please re-enter your address or business name. Unsuccessful for the following reason: ' + status);
            }
            //invoking the route calculation
            calcRoute(buttonAddress)
        });
    };

    //reverse geocoding the current coordinates to create a physical address for current location VVVVVVVVVVVVVVVVVVV

    function geocodeLatLng(geocoder) {

        var latlng = {
            lat: parseFloat(currentLatitude),
            lng: parseFloat(currentLongitude)
        };
        geocoder.geocode({ 'location': latlng }, function (results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    currentPhysicalAddress = results[0].formatted_address
                    //display the coordinates and address where we are
                    $("#GPS").text(currentPhysicalAddress);

                } else {
                    window.alert('No results found');
                }
            } else {
                window.alert('Geocoder failed due to: ' + status);
            };
        });
    };

    //Adding and updating the information in the table
    function tableContent(buttonAddress) {

        //add to table section
        var $td = $('<tr><th scope="row">' + buttonAddress + '</th><td>' + parsTravTime + '</td><td>' + shortArrivalTime + '</td><td>' + tripDist + '</td></tr>')

        //prevents duplicate table rows being created
        if ($(".favButts").length >= $("tr").length) {
            $("#tableInsertTarget").append($td)
        }
    }

    //Refreshing tables
    function tableRefresh() {
        $("#tableInsertTarget").empty()
        userPath.once("value")
            .then(function (snapshot) {
                snapshot.forEach(function (childSnapshot) {

                    var childData = childSnapshot.val().address;

                    calculateAddressCoordinates(childData);
                });
            });
    }

    //************************************ */
    //END MAPS/DISTANCE Functions & Methods ^^^^^^^^^^^^
    //************************************ */

    //************************************ */
    //Weather Functions and Methods VVVVVVVVVV
    //************************************* */

    //ajax calling current weather data for current location


    //var longNlatCurrent = $("#longNLatVar")
    // var longNlatCurrent = "33.303176,-111.839866"


    function findWeather() {

        var darkSkyCurrLat = currentLatitude.toFixed(4);
        var darkSkyCurrLng = currentLongitude.toFixed(4);

        var proxy = 'https://cors-anywhere.herokuapp.com/'
        // var proxy = 'https://git.heroku.com/fast-thicket-34943.git/';
        var currapiLinkDS = "https://api.darksky.net/forecast/087545328826e2aa2daf703ad2508bfd/" + darkSkyCurrLat + "," + darkSkyCurrLng;

        $.ajax({
            url: proxy + currapiLinkDS,
            // method: "GET",
            success: function (data) {

                //VARS
                var current = data.currently.apparentTemperature;
                var tempMax = data.daily.data[0].apparentTemperatureMax;
                var tempMin = data.daily.data[0].apparentTemperatureMin;
                var summary = data.daily.summary;
                var icon = data.daily.icon;

                //jQuery Elements
                $("#currentTemp").html("Current Temp: <br>" + current);
                $("#tempMax").html("High Temp: <br>" + tempMax);
                $("#tempMin").html("Low Temp: <br>" + tempMin);
                $("#summary").html("Forecast: <br>" + summary);
                $("#currentIcon").html(icon);

                //Icon Logic
                if (icon === "clear-day" || icon === "clear-night") {
                    $('#currentIcon').html('<img class="icon" src="Assets/images/weather-icons/sunny-icon.jpg" />');
                }
                if (icon === "rain") {
                    $('#currentIcon').html('<img class="icon" src="Assets/images/weather-icons/rain-icon.jpg" />');
                }
                if (icon === "cloudy" || icon === "partly-cloudy-night" || icon === "partly-cloudy-day") {
                    $('#currentIcon').html('<img class="icon" src="Assets/images/weather-icons/cloudy-icon.png" />');
                }
                if (icon === "sleet") {
                    $('#currentIcon').html('<img class="icon" src="Assets/images/weather-icons/sleet-icon.png" />');
                }
                if (icon === "wind") {
                    $('#currentIcon').html('<img class="icon" src="Assets/images/weather-icons/wind-icon.png" />');
                }
                if (icon === "fog") {
                    $('#currentIcon').html('<img class="icon" src="Assets/images/weather-icons/fog-icon.png" />');
                }
                if (icon === "hail") {
                    $('#currentIcon').html('<img class="icon" src="Assets/images/weather-icons/hail-icon.png" />');
                }
                if (icon === "thunderstorm") {
                    $('#currentIcon').html('<img class="icon" src="Assets/images/weather-icons/thunderstorm-icon.png" />');
                }
                if (icon === "tornado") {
                    $('#currentIcon').html('<img class="icon" src="Assets/images/weather-icons/tornado-icon.png" />');
                }
            }
        });

        // calling weather for destination
        var destapiLinkDS = "https://api.darksky.net/forecast/087545328826e2aa2daf703ad2508bfd/" + destLatitude + "," + destLongitude;

        $.ajax({
            url: proxy + destapiLinkDS,
            success: function (data) {

                //VARS
                var destination = data.currently.apparentTemperature;
                var tempMax = data.daily.data[0].apparentTemperatureMax;
                var tempMin = data.daily.data[0].apparentTemperatureMin;
                var summary = data.daily.summary;
                var icon = data.daily.icon

                //jQuery Elements
                $("#DestCurrTemp").html("Current Temp: <br>" + destination);
                $("#DestHighTemp").html("High Temp: <br>" + tempMax);
                $("#DestLowTemp").html("Low Temp: <br>" + tempMin);
                $("#summaryDestination").html("Forecast: <br>" + summary);
                // $("#DestIcon").text(icon);

                //Icon Logic
                if (icon === "clear-day" || icon === "clear-night") {
                    $('#DestIcon').html('<img class="icon-destination" src="Assets/images/weather-icons/sunny-icon.jpg" />');
                }
                if (icon === "rain") {
                    $('#DestIcon').html('<img class="icon-destination" src="Assets/images/weather-icons/rain-icon.jpg" />');
                }
                if (icon === "cloudy" || icon === "partly-cloudy-night" || icon === "partly-cloudy-day") {
                    $('#DestIcon').html('<img class="icon" src="Assets/images/weather-icons/cloudy-icon.png" />');
                }
                if (icon === "sleet") {
                    $('#DestIcon').html('<img class="icon-destination" src="Assets/images/weather-icons/sleet-icon.png" />');
                }
                if (icon === "wind") {
                    $('#DestIcon').html('<img class="icon-destination" src="Assets/images/weather-icons/wind-icon.png" />');
                }
                if (icon === "fog") {
                    $('#DestIcon').html('<img class="icon-destination" src="Assets/images/weather-icons/fog-icon.png" />');
                }
                if (icon === "hail") {
                    $('#DestIcon').html('<img class="icon-destination" src="Assets/images/weather-icons/hail-icon.png" />');
                }
                if (icon === "thunderstorm") {
                    $('#DestIcon').html('<img class="icon-destination" src="Assets/images/weather-icons/thunderstorm-icon.png" />');
                }
                if (icon === "tornado") {
                    $('#DestIcon').html('<img class="icon-destination" src="Assets/images/weather-icons/tornado-icon.png" />');
                }
            }
        });
    }




    //************************************ */
    //END Weather Functions and Methods ^^^^^^^^^^^
    //************************************* */

    //************************************** */
    //All Calls and invokations below this point VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    //************************************** */

    //Login/Account Invocation
    $(document).on("submit", "#signUp", createAccount)
    //Login/Account Invocation
    $(document).on("submit", "#signIn", signInFn)
    //Login/Account Invocation
    firebase.auth().onAuthStateChanged(authStateChangeListener);

    //sets time to run. will tie in all data calls to this to enable live refreshing
    setTime();

    //MAPS/GEO-run Geo initialization outright
    initGeoCode();

    //DATABASE/MAPS/GEO-Saves information for new destination and adds it to DB, which in turn runs "child_added" function to add button
    $("#dest-btn").on("click", function (event) {
        event.preventDefault();
        destInput = $("#dest-input").val().trim();
        destName = $("#dest-name").val().trim();
        var newDest = {
            "name": destName,
            "address": destInput
        };
        userPath.push(newDest);
    });

    //Will pull address from saved destination, and run to see desired time and weather.
    $(document).on("click", ".favButts", function (event) {
        //grabs the address stored in the id of the botton
        var buttonAddress = event.target.id
        calculateAddressCoordinates(buttonAddress);

    })

    //**************************************** */
    //END Calls and Invocations
    //**************************************** */

});

