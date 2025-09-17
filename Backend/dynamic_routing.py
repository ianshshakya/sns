import osmnx as ox
import networkx as nx
import folium
import tempfile
import webbrowser
from shapely.geometry import Polygon
from geopy.distance import geodesic

def geocode_place(place_name):
    """Convert a place name into (lat, lon) coordinates."""
    try:
        coords = ox.geocode(place_name)
        print(f"📍 Geocoded '{place_name}' -> {coords}")
        return coords
    except Exception as e:
        print(f"❌ Geocoding failed for '{place_name}': {e}")
        return None

def get_combined_graph_adaptive(start_point, dest_point, buffer_deg=0.01, max_attempts=5):
    """
    Downloads the road network using an adaptive bounding box.
    
    This function iteratively expands the search area until a connected graph
    containing both the start and destination points is found, up to a maximum number of attempts.
    
    Args:
        start_point (tuple): (lat, lon) coordinates of the start point.
        dest_point (tuple): (lat, lon) coordinates of the destination point.
        buffer_deg (float): The initial buffer in degrees to expand the bounding box.
        max_attempts (int): The maximum number of attempts to find a connected graph.
        
    Returns:
        networkx.MultiDiGraph: A connected road network graph, or None if unsuccessful.
    """
    attempt = 0
    while attempt < max_attempts:
        print(f"🌍 Attempting to download graph... (Search buffer: {buffer_deg:.2f} degrees)")
        
        north = max(start_point[0], dest_point[0]) + buffer_deg
        south = min(start_point[0], dest_point[0]) - buffer_deg
        east = max(start_point[1], dest_point[1]) + buffer_deg
        west = min(start_point[1], dest_point[1]) - buffer_deg
        
        bbox_polygon = Polygon([
            (west, south), (west, north),
            (east, north), (east, south),
            (west, south)
        ])
        
        try:
            G = ox.graph_from_polygon(bbox_polygon, network_type="drive", simplify=True)
            G = ox.add_edge_speeds(G)
            G = ox.add_edge_travel_times(G)
            
            # Check if start and destination nodes exist in the new graph
            orig_node = ox.distance.nearest_nodes(G, start_point[1], start_point[0])
            dest_node = ox.distance.nearest_nodes(G, dest_point[1], dest_point[0])

            if nx.has_path(G, orig_node, dest_node):
                print("✅ Graph is connected and contains a path.")
                return G
            else:
                print("⚠️ Graph downloaded, but no path found. Expanding search area.")
                buffer_deg *= 2
                attempt += 1
        except Exception as e:
            print(f"⚠️ An error occurred while downloading the graph: {e}. Retrying with a larger buffer.")
            buffer_deg *= 2
            attempt += 1

    print(f"❌ Failed to find a connected graph after {max_attempts} attempts.")
    return None

def find_multiple_routes(G, start_point, dest_point):
    """
    Finds multiple routes (shortest time and shortest distance) between two points.
    
    Args:
        G (networkx.MultiDiGraph): The road network graph.
        start_point (tuple): (lat, lon) coordinates of the start.
        dest_point (tuple): (lat, lon) coordinates of the destination.
    
    Returns:
        tuple: A tuple containing two route dictionaries (fastest, shortest),
               or (None, None) if no route is found.
    """
    try:
        orig_node = ox.distance.nearest_nodes(G, start_point[1], start_point[0])
        dest_node = ox.distance.nearest_nodes(G, dest_point[1], dest_point[0])

        # Find the fastest route
        fastest_route = nx.shortest_path(G, orig_node, dest_node, weight="travel_time")
        
        # Manually calculate travel time and distance for the fastest route
        fastest_time_sec = 0
        fastest_dist_m = 0
        for u, v, key in G.edges(fastest_route, keys=True):
            if u in fastest_route and v in fastest_route:
                edge_data = G.get_edge_data(u, v, key)
                fastest_time_sec += edge_data.get("travel_time", 0)
                fastest_dist_m += edge_data.get("length", 0)
        
        fastest_route_info = {
            "route": fastest_route,
            "eta_min": fastest_time_sec / 60,
            "distance_km": fastest_dist_m / 1000
        }
        
        # Find the shortest distance route
        shortest_route = nx.shortest_path(G, orig_node, dest_node, weight="length")
        
        # Manually calculate travel time and distance for the shortest route
        shortest_time_sec = 0
        shortest_dist_m = 0
        for u, v, key in G.edges(shortest_route, keys=True):
            if u in shortest_route and v in shortest_route:
                edge_data = G.get_edge_data(u, v, key)
                shortest_time_sec += edge_data.get("travel_time", 0)
                shortest_dist_m += edge_data.get("length", 0)

        shortest_route_info = {
            "route": shortest_route,
            "eta_min": shortest_time_sec / 60,
            "distance_km": shortest_dist_m / 1000
        }
        
        return fastest_route_info, shortest_route_info
    except Exception as e:
        print(f"❌ Error finding routes: {e}")
        return None, None

def plot_routes_on_map(G, routes_info, start_point, dest_point):
    """Plot multiple routes on interactive map and open in browser."""
    # Start with the fastest route, which should be the most relevant
    center_route_coords = [(G.nodes[n]["y"], G.nodes[n]["x"]) for n in routes_info[0]["route"]]
    m = folium.Map(location=center_route_coords[0], zoom_start=13, tiles="cartodbpositron")

    colors = ["blue", "red"] # Fastest, Shortest
    popups = ["Fastest Route", "Shortest Distance Route"]

    for i, route_info in enumerate(routes_info):
        route = route_info["route"]
        eta = route_info["eta_min"]
        distance = route_info["distance_km"]
        color = colors[i]
        popup = popups[i]
        
        route_coords = [(G.nodes[n]["y"], G.nodes[n]["x"]) for n in route]
        popup_text = f"<b>{popup}</b><br>ETA: {eta:.1f} min<br>Distance: {distance:.2f} km"
        folium.PolyLine(route_coords, color=color, weight=5, opacity=0.8, popup=popup_text).add_to(m)

    # Mark start and destination
    folium.Marker(start_point, popup="Start", icon=folium.Icon(color="green")).add_to(m)
    folium.Marker(dest_point, popup="Destination", icon=folium.Icon(color="red")).add_to(m)

    # Save to temp HTML and open
    temp_file = tempfile.NamedTemporaryFile(suffix=".html", delete=False)
    m.save(temp_file.name)
    webbrowser.open(f"file://{temp_file.name}")
    print("✅ Routes shown in browser.")


# ---------------- MAIN ---------------- #
if __name__ == "__main__":
    start_name = input("Enter start location: ")
    dest_name = input("Enter destination location: ")

    start_point = geocode_place(start_name)
    if not start_point:
        exit()

    dest_point = geocode_place(dest_name)
    if not dest_point:
        exit()

    G = get_combined_graph_adaptive(start_point, dest_point)

    if G:
        fastest_route_info, shortest_route_info = find_multiple_routes(G, start_point, dest_point)

        if fastest_route_info and shortest_route_info:
            print("\n🚗 Fastest Route:")
            print(f"   ⏱ ETA: {fastest_route_info['eta_min']:.2f} minutes")
            print(f"   📏 Distance: {fastest_route_info['distance_km']:.2f} km")
            
            print("\n🚗 Shortest Distance Route:")
            print(f"   ⏱ ETA: {shortest_route_info['eta_min']:.2f} minutes")
            print(f"   📏 Distance: {shortest_route_info['distance_km']:.2f} km")
            
            plot_routes_on_map(G, [fastest_route_info, shortest_route_info], start_point, dest_point)
        else:
            print("❌ No route found between the two locations.")
    else:
        print("❌ Could not create a connected road network graph.")
