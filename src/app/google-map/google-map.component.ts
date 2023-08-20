import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

interface Waypoint {
  name: string;
  location: google.maps.LatLng;
  popularity: number;
}

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.css']
})
export class GoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) gmap!: ElementRef;
  
  map!: google.maps.Map;
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();

  source!: string;
  destination!: string;
  distanceInKm: string = '';
  waypoints: Waypoint[] = [];
  selectedWaypoints: Waypoint[] = [];
  attractions: any[] = []; // to store attractions
  isSidebarOpen = false;
  routeFound: boolean = false;





  ngAfterViewInit() {
    const mapOptions: google.maps.MapOptions = {
      center: new google.maps.LatLng(40.730610, -73.935242),  // Defaults to NYC
      zoom: 10
    };

    this.map = new google.maps.Map(this.gmap.nativeElement, mapOptions);
    this.directionsRenderer.setMap(this.map);
  }

  displayRoute() {
    this.attractions = [];
    if (this.source && this.destination) {
      this.directionsService.route({
        origin: this.source,
        destination: this.destination,
        travelMode: google.maps.TravelMode.DRIVING
      }, (response, status) => {
        if (status === 'OK') {
          this.routeFound = true;
          this.directionsRenderer.setDirections(response);
  
          // Get the distance of the route
          const routeDistance = response.routes[0].legs[0].distance;
          
          this.distanceInKm = `${(routeDistance.value / 1000).toFixed(2)} km`;
          
        } else {
          alert('Directions request failed due to ' + status);
        }

        const overviewPath = response.routes[0].overview_path;
        this.waypoints = overviewPath.map((point, idx) => ({
          name: `Waypoint ${idx + 1}`,
          location: point,
          popularity: Math.floor(Math.random() * 10) + 1  // random popularity between 1 and 10
        })).sort((a, b) => b.popularity - a.popularity).slice(0, 10);
      });
    } else {
      alert('Please enter both source and destination.');
    }
  }

  

  searchAttractionsForSelectedWaypoints() {
    this.attractions = []; // Clear existing attractions

    this.selectedWaypoints.forEach(waypoint => {
      this.searchAttractions(waypoint.location);
    });
  }

  searchAttractions(location: google.maps.LatLng) {
    const service = new google.maps.places.PlacesService(this.map);

    service.nearbySearch({
      location: location.toJSON(),
      radius: 5000, // search within 5km
      type: 'tourist_attraction',
      rankBy: google.maps.places.RankBy.PROMINENCE
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const topAttractions = results.sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0)).slice(0, 3);
        // Add the results to your attractions array
        this.attractions.push(...topAttractions);
        topAttractions.forEach(attraction => {
          this.addMarker(attraction);
        });
      }
    });
  }

  toggleWaypointSelection(waypoint: Waypoint) {
    const index = this.selectedWaypoints.findIndex(w => w.location.equals(waypoint.location));

    if (index > -1) {
      this.selectedWaypoints.splice(index, 1); // Remove if already selected
    } else {
      this.selectedWaypoints.push(waypoint); // Add if not selected
    }

    this.searchAttractionsForSelectedWaypoints(); // Update attractions based on new selection
  }

  addMarker(attraction: any) {
    const marker = new google.maps.Marker({
      map: this.map,
      position: attraction.geometry.location,
      title: attraction.name
    });

    // Optional: Add an info window to display attraction details on marker click
    const infoWindow = new google.maps.InfoWindow({
      content: `<h5>${attraction.name}</h5><p>${attraction.vicinity}</p>`
    });

    marker.addListener('click', () => {
      infoWindow.open(this.map, marker);
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}