import {Map, Marker, LngLat, LngLatBounds} from 'mapbox-gl--ENV'
import Device from '../libs/device'
import layouts from "../panel/layouts.js";
import constants from '../../config/constants.yml'


export default class SceneCategory {
  constructor(map) {
    this.map = map
    this.markers = []

    listen('add_category_markers', (pois) => {
      console.log(pois)
      this.addCategoryMarkers(pois);
    })
  }

  addCategoryMarkers(pois) {
    this.removeOsmPois() // first remove the existing OSM Pois
    pois.forEach((poi) => {
          const marker = document.createElement('div')

          marker.className = 'category_marker'
          this.markers.push(
              new Marker(marker)
                  .setLngLat(poi.latLon)
                  .addTo(this.map)
          )
        }
    )
  }

  removeOsmPois() {
    constants.map.pois.map(poi => this.map.removeLayer(poi))
  }
}