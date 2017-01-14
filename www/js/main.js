var MapboxClient = require('mapbox');
var client = new MapboxClient('pk.eyJ1IjoiZW1pbGllZGFubmVuYmVyZyIsImEiOiJjaXhmOTB6ZnowMDAwMnVzaDVkcnpsY2M1In0.33yDwUq670jHD8flKjzqxg');
client.geocodeForward('Chester, NJ', function(err, res) {
  // res is the geocoding result as parsed JSON
  console.log('hi'); 
});
