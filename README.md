# Neighborhood Map 

This is a [Udacity FSND](https://www.udacity.com/course/full-stack-web-developer-nanodegree--nd004) project.
The deployed application can be accessed [here](https://www.zlateff.com/gameday/).

## About

The Neighborhood Map project is a single page application developed using the Knockout.JS framework and number of APIs. The app allows users in the Chicago area to find entertainment and parking near their sports team venue, and to save places to their favorites list. Aside from the various Google Maps APIs, team news information is added using the News API. 

### Getting started

* Download/clone the repository and open `app/index.html`
* Or you can access the demo at [https://www.zlateff.com/gameday/](https://www.zlateff.com/gameday/)

### App functionalities
* Automatically adapts to different viewports, adjusts bounds and zooms to accommodate all markers.
* Navigation moves offcanvas on smaller viewports and opens and closes with a hamburger icon
* Mapping functionality using Google Maps APIs
* Shows sports venue StreetView when team marker clicked
* Searching for places using the Google Places API offering suggestions
* Feature to add/remove places to a Favorites list saved in localStorage
* Access to the latest team news pulled using News API