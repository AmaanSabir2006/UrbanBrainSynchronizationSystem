import os
import threading
import time
import math
import random
from django.apps import AppConfig

class CoreConfig(AppConfig):
    name = 'core'

    def ready(self):
        # Run the simulator thread only in Django's main process
        if os.environ.get('RUN_MAIN') == 'true':
            from core.mongo_utils import get_mongo_collection

            # Configured baselines and safe amplitude limits per zone
            ZONE_CONFIGS = {
                "Z003": {"baseline": 65.0, "amplitude": 30.0},    # Fluctuates between 35cm and 95cm (Normal)
                "Z005": {"baseline": 175.0, "amplitude": 45.0},   # Fluctuates between 130cm and 220cm (High/Critical)
                "Z009": {"baseline": 95.0, "amplitude": 25.0},    # Fluctuates between 70cm and 120cm (Normal to Warning)
                "Z008": {"baseline": 40.0, "amplitude": 15.0},    # Fluctuates between 25cm and 55cm (Normal)
            }

            def run_telemetry_simulation():
                time.sleep(5)  # Wait for Django server initialization
                while True:
                    try:
                        telemetry_col = get_mongo_collection("disaster_telemetry")
                        
                        # Query active pairings from PostgreSQL
                        from django.db import connection
                        query = """
                        SELECT daz.event_id, daz.zone_id 
                        FROM disaster_affected_zones daz
                        JOIN disaster_events de ON daz.event_id = de.event_id
                        WHERE de.status = 'ACTIVE' 
                          AND daz.evacuation_status != 'COMPLETED'
                        """
                        with connection.cursor() as cursor:
                            cursor.execute(query)
                            active_pairs = cursor.fetchall()

                        if not active_pairs:
                            sensors = []
                        else:
                            or_clauses = [{"event_id": int(item[0]), "zone_id": str(item[1])} for item in active_pairs]
                            sensors = list(telemetry_col.find({"$or": or_clauses}))

                        for sensor in sensors:
                            zone_id = sensor.get("zone_id")
                            if not zone_id:
                                continue

                            # Get zone settings or fallback to standard baseline
                            config = ZONE_CONFIGS.get(zone_id, {"baseline": 80.0, "amplitude": 20.0})

                            # Calculate a slow sinusoidal tide wave based on current time.
                            # A full wave cycle (peak-to-peak) takes 30 minutes.
                            minutes = time.time() / 60.0
                            cycle_period_minutes = 30.0
                            angle = (minutes / cycle_period_minutes) * 2.0 * math.pi

                            # Base wave height + micro noise (+/- 1.5 cm) to keep the line active
                            sine_height = math.sin(angle) * config["amplitude"]
                            noise = random.uniform(-1.5, 1.5)
                            
                            new_level = max(0.0, min(250.0, round(config["baseline"] + sine_height + noise, 1)))

                            # Synchronize new levels in MongoDB and push to the history trend array (limited to last 12 entries)
                            telemetry_col.update_one(
                                {"zone_id": zone_id},
                                {
                                    "$set": {"telemetry.water_level_cm": new_level},
                                    "$push": {
                                        "history": {
                                            "$each": [new_level],
                                            "$slice": -12  # Keep only the last 12 readings
                                        }
                                    }
                                }
                            )
                    except Exception as e:
                        print(f"Error in background telemetry simulation thread: {e}")

                    time.sleep(30)  # Updates database state every 30 seconds

            thread = threading.Thread(target=run_telemetry_simulation, daemon=True)
            thread.start()