document.getElementById("detectLocation").addEventListener("click", () => {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    } else {
        alert("Your browser does not support location access.");
    }

});  

