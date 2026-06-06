# backend/core/seed_mongo.py
import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.mongo_utils import get_mongo_collection

def seed_realtime_telemetry():
    collection = get_mongo_collection()
    
    # Wipe the collection clean to avoid duplicate conflicts
    collection.delete_many({})

    # ALIGNED BLUEPRINT: Matching data types perfectly with your PostgreSQL state
    mock_documents = [
        # --- EVENT ID 1 CARDS ---
        {
            "event_id": 1,
            "zone_id": "Z003",  # Johar Town
            "telemetry": { "water_level_cm": 45.8 },
            "demographics": { "elderly_population": 227, "children_population": 110 }
        },
        {
            "event_id": 1,
            "zone_id": "Z005",  # Walled City
            "telemetry": { "water_level_cm": 184.2 },
            "demographics": { "elderly_population": 142, "children_population": 95 }
        },
        {
            "event_id": 1,
            "zone_id": "Z009",  # Shalimar
            "telemetry": { "water_level_cm": 92.1 },
            "demographics": { "elderly_population": 88, "children_population": 64 }
        },

        # --- EVENT ID 4 CARDS ---
        {
            "event_id": 4,
            "zone_id": "Z005",  # Walled City under secondary crisis threat
            "telemetry": { "water_level_cm": 210.5 },
            "demographics": { "elderly_population": 190, "children_population": 140 }
        },
        {
            "event_id": 4,
            "zone_id": "Z008",  # Match for your 5th active row entry
            "telemetry": { "water_level_cm": 15.0 },
            "demographics": { "elderly_population": 34, "children_population": 12 }
        }
    ]

    result = collection.insert_many(mock_documents)
    print(f"🎉 MongoDB Aligned & Seeded! Inserted {len(result.inserted_ids)} target telemetry documents.")

if __name__ == "__main__":
    seed_realtime_telemetry()