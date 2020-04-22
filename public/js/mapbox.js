/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYXYtcnViaW5jaGlrIiwiYSI6ImNrOHZ3OHpyYzA1MnczbW8waHFpN3M3NDIifQ.FKEau1jJ4UaU-TKvP7Ssmg'; //create a unique on website
  var map = new mapboxgl.Map({
    container: 'map', //id of element to put map on
    style: 'mapbox://styles/av-rubinchik/ck8vwfjfd1tv71imoyzo0grcu', //create a style on website and copy a link
    scrollZoom: false
    // center: [-118.503637, 34.045417],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup
    new mapboxgl.Popup({
      offset: 30,
      closeButton: false
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  })

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
}
