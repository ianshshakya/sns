from flask import Flask, request, jsonify
import googlemaps
from datetime import datetime
from polyline import decode
import osmnx as ox
import networkx as nx
import requests
import openrouteservice
from flask_cors import CORS

# ---------------- CONFIG ---------------- #
GOOGLE_API_KEY = "AIzaSyAF09rLogqed3O0P-CGf3I2Sz0x_9F9R_4"
ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNhODJjOWI3YzQwMjQ3YzM5M2FkMWU2YmMwOWUwYmNhIiwiaCI6Im11cm11cjY0In0="

gmaps = googlemaps.Client(key=GOOGLE_API_KEY)
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# ---------------- HELPERS ---------------- #
def get_current_location():
    try:
        response = requests.get("https://ipinfo.io/json")
        data = response.json()
        lat, lng = map(float, data["loc"].split(","))
        return (lat, lng)
    except:
        return None

def reverse_geocode(coords):
    try:
        result = gmaps.reverse_geocode(coords)
        if result:
            return result[0]["formatted_address"]
    except:
        pass
    return f"{coords[0]}, {coords[1]}"

# ---------------- NOMINATIM PROXY ---------------- #
@app.route("/nominatim")
def nominatim():
    query = request.args.get("q")
    if not query:
        return jsonify([])

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "format": "json",
            "addressdetails": 1,
            "limit": 5,
            "q": query
        }
        headers = {
            "User-Agent": "YourAppName/1.0 (your-email@example.com)"
        }
        r = requests.get(url, params=params, headers=headers)
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- ROUTE FUNCTIONS ---------------- #
def get_google_routes(start, dest):
    now = datetime.now()
    try:
        directions_result = gmaps.directions(
            start, dest, mode="driving", departure_time=now, traffic_model="best_guess", alternatives=True
        )
    except:
        return None

    if not directions_result:
        return None

    routes = []
    for route in directions_result:
        leg = route['legs'][0]
        routes.append({
            "polyline": route['overview_polyline']['points'],
            "summary": route.get("summary", ""),
            "distance": leg['distance']['text'],
            "duration": leg['duration']['text'],
            "duration_in_traffic": leg.get('duration_in_traffic', {}).get('text', "N/A"),
            "source": "google"
        })
    return routes

def get_ors_routes(start_coords, dest_coords):
    try:
        client = openrouteservice.Client(key=ORS_API_KEY)
        result = client.directions(
            coordinates=[(start_coords[1], start_coords[0]), (dest_coords[1], dest_coords[0])],
            profile="driving-car",
            format="geojson",
            alternatives=3
        )
        routes = []
        for i, feature in enumerate(result["features"]):
            coords = [(lat, lng) for lng, lat in feature["geometry"]["coordinates"]]
            summary = feature["properties"]["summary"]
            routes.append({
                "coords": coords,
                "summary": f"ORS Route {i+1}",
                "distance": f"{summary['distance']/1000:.2f} km",
                "duration": f"{summary['duration']/60:.1f} mins",
                "source": "ors"
            })
        return routes
    except:
        return None

def get_osmnx_route(start_coords, dest_coords, place="New Delhi, India"):
    try:
        G = ox.graph_from_place(place, network_type="drive")
        orig = ox.nearest_nodes(G, start_coords[1], start_coords[0])
        dest = ox.nearest_nodes(G, dest_coords[1], dest_coords[0])
        route = nx.shortest_path(G, orig, dest, weight="length")
        route_coords = [(G.nodes[n]["y"], G.nodes[n]["x"]) for n in route]
        return [{
            "coords": route_coords,
            "summary": "OSMnx Shortest Path",
            "source": "osmnx"
        }]
    except:
        return None

# ---------------- API ENDPOINT ---------------- #
@app.route("/get_routes", methods=["POST"])
def get_routes():
    data = request.json
    start_address = data.get("start")
    dest_address = data.get("destination")

    if not start_address:
        start_coords = get_current_location()
        if not start_coords:
            return jsonify({"error": "Could not detect current location"}), 400
        start_address = f"{start_coords[0]},{start_coords[1]}"
    else:
        start_location = gmaps.geocode(start_address)
        if not start_location:
            return jsonify({"error": "Invalid start address"}), 400
        loc = start_location[0]['geometry']['location']
        start_coords = (loc['lat'], loc['lng'])

    dest_location = gmaps.geocode(dest_address)
    if not dest_location:
        return jsonify({"error": "Invalid destination address"}), 400
    loc = dest_location[0]['geometry']['location']
    dest_coords = (loc['lat'], loc['lng'])

    start_full = reverse_geocode(start_coords)
    dest_full = reverse_geocode(dest_coords)

    routes = get_google_routes(start_address, dest_address)
    if not routes:
        routes = get_ors_routes(start_coords, dest_coords)
    if not routes:
        routes = get_osmnx_route(start_coords, dest_coords)

    return jsonify({
        "start": start_full,
        "destination": dest_full,
        "start_coords": start_coords,
        "dest_coords": dest_coords,
        "routes": routes
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)
