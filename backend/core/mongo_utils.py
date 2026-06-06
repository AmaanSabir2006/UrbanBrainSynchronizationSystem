from pymongo import MongoClient

# Base connection string for a local MongoDB instance
MONGO_URI = "mongodb://localhost:27017/"

# Define the client and DB instance once at the module level
client = MongoClient(MONGO_URI)
db = client["urbs_polyglot"]

def get_mongo_collection(collection_name="disaster_telemetry"):
    """
    Returns the target MongoDB collection. Reuses the global client connection pool
    instead of opening a new socket connection on every single API request.
    """
    return db[collection_name]