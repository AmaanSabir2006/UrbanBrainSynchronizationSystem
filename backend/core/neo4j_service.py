from neo4j import GraphDatabase
import os

NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "urbs_database"

class Neo4jConnection:
    def __init__(self):
        self._driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    def close(self):
        self._driver.close()

    def query(self, cypher_query, parameters=None):
        with self._driver.session() as session:
            result = session.run(cypher_query, parameters)
            return [record.data() for record in result]

# Instantiate a single global connection node
neo4j_db = Neo4jConnection()


from django.db import connection as postgres_conn
import random

def sync_postgres_to_neo4j():
    """Extracts zones from PostgreSQL and syncs them into Neo4j."""
    
    # 1. Extract live rows from your PostgreSQL table
    with postgres_conn.cursor() as cursor:
        cursor.execute("SELECT zone_id, zone_name FROM zones;")
        postgres_zones = cursor.fetchall()

    # 2. Iterate and mirror them inside Neo4j
    for zone in postgres_zones:
        zone_id, zone_name = zone
        
        # We assign randomized coordinates so the 2D React graph has space to display nodes nicely
        cypher = """
        MERGE (z:Zone {id: $zone_id})
        ON CREATE SET z.name = $zone_name, z.x = $x, z.y = $y
        ON MATCH SET z.name = $zone_name
        """
        
        params = {
            "zone_id": str(zone_id),
            "zone_name": zone_name,
            "x": random.randint(100, 600),
            "y": random.randint(100, 500)
        }
        neo4j_db.query(cypher, params)
        
    print(f"Successfully synced {len(postgres_zones)} zones from Postgres to Neo4j Graph Core.")

def get_live_graph_network():
    """Fetches all Zone nodes and CONNECTS_TO relationships for the React frontend."""
    
    # 1. Fetch all nodes with their visual properties
    node_query = "MATCH (z:Zone) RETURN z.id AS id, z.name AS name, z.x AS x, z.y AS y"
    raw_nodes = neo4j_db.query(node_query)
    
    # 2. Fetch all unique road connections
    edge_query = "MATCH (a:Zone)-[r:CONNECTS_TO]->(b:Zone) RETURN a.id AS source, b.id AS target, r.distance AS distance"
    raw_edges = neo4j_db.query(edge_query)
    
    # 3. Format the data into the exact structure React needs
    network_data = {
        "nodes": [{"id": node["id"], "name": node["name"], "x": node["x"], "y": node["y"]} for node in raw_nodes],
        "links": [{"source": edge["source"], "target": edge["target"], "distance": edge["distance"]} for edge in raw_edges]
    }
    
    return network_data


def get_shortest_path(start_id, end_id):
    """Calculates the shortest path regardless of link directionality, auto-normalizing ID prefixes."""
    
    # Prefix normalization step to make sure lookups match database entries perfectly
    start_str = str(start_id) if str(start_id).startswith('Z') else f"Z00{start_id}"
    end_str = str(end_id) if str(end_id).startswith('Z') else f"Z00{end_id}"

    cypher = """
    MATCH (start:Zone {id: $start_id}), (end:Zone {id: $end_id})
    MATCH p = shortestPath((start)-[:CONNECTS_TO*..20]-(end))
    RETURN 
        [node in nodes(p) | node.id] AS path_node_ids,
        reduce(s = 0, rel in relationships(p) | s + toFloat(rel.distance)) AS total_distance
    """
    
    params = {"start_id": start_str, "end_id": end_str}
    result = neo4j_db.query(cypher, params)
    
    if result and result[0]['path_node_ids']:
        return {
            "path": result[0]['path_node_ids'],
            "total_distance": round(float(result[0]['total_distance']), 1)
        }
        
    return {"path": [], "total_distance": 0}