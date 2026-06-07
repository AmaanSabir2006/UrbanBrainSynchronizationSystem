from django.shortcuts import render
from django.db import connection
# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.mongo_utils import get_mongo_collection
from .models import Zones
from .serializers import ZoneSerializer

@api_view(['GET'])
def home(request):
    return Response({
        "message": "Urban Brain Synchronization System API Running"
    })


@api_view(['GET'])
def get_zones(request):
    zones = Zones.objects.all()
    serializer = ZoneSerializer(zones, many=True)
    return Response(serializer.data)


#######################################



from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def resource_forecast(request):

    query = """
SELECT
    r.resource_id,
    r.resource_type,
    r.current_level,
    r.critical_threshold,

    AVG(rc.consumed_amount) AS avg_daily_consumption,

    ROUND(
        (r.current_level / AVG(rc.consumed_amount))::numeric,
        2
    ) AS days_until_empty,

    ROUND(
        ((r.current_level - r.critical_threshold)
        / AVG(rc.consumed_amount))::numeric,
        2
    ) AS days_until_critical

FROM resources r

JOIN resource_consumption_log rc
ON r.resource_id = rc.resource_id

GROUP BY
    r.resource_id,
    r.resource_type,
    r.current_level,
    r.critical_threshold
"""

    with connection.cursor() as cursor:

        cursor.execute(query)

        columns = [col[0] for col in cursor.description]

        rows = cursor.fetchall()

    result = [
        dict(zip(columns, row))
        for row in rows
    ]

    return Response(result)



    ###################################################

from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def disaster_impact_assessment(request):
    query = """
    SELECT
        de.event_id,
        de.event_type,
        de.severity_level,
        de.status,
        z.zone_id,
        z.zone_name,
        z.risk_classification,
        c.total_population,
        daz.evacuation_status,
        COUNT(ia.asset_id) AS assets_at_risk
    FROM disaster_events de
    JOIN disaster_affected_zones daz ON de.event_id = daz.event_id
    JOIN zones z ON daz.zone_id = z.zone_id
    LEFT JOIN citizens c ON z.zone_id = c.zone_id
    LEFT JOIN infrastructure_assets ia ON z.zone_id = ia.zone_id
    WHERE de.status = 'ACTIVE'
      AND daz.evacuation_status != 'COMPLETED'
    GROUP BY
        de.event_id, de.event_type, de.severity_level, de.status,
        z.zone_id, z.zone_name, z.risk_classification, c.total_population,
        daz.evacuation_status
    """

    with connection.cursor() as cursor:
        cursor.execute(query)
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]

    mongo_collection = get_mongo_collection()

    for record in results:
        current_event_id = record.get("event_id")
        current_zone_id = record.get("zone_id")
        
        mongo_document = mongo_collection.find_one({
            "event_id": current_event_id,
            "zone_id": current_zone_id
        })

        if mongo_document:
            telemetry_data = mongo_document.get("telemetry", {})
            demographics_data = mongo_document.get("demographics", {})
            
            record["current_water_level_cm"] = telemetry_data.get("water_level_cm", 0)
            record["elderly_count"] = demographics_data.get("elderly_population", 0)
            record["mobility_impaired_count"] = demographics_data.get("mobility_impaired_population", 0)
        else:
            record["current_water_level_cm"] = 0
            record["elderly_count"] = 0
            record["mobility_impaired_count"] = 0

    return Response(results)
#######################################################################


@api_view(['GET'])
def fuel_failure_simulation(request):

    query = """
    SELECT
        r.resource_id,
        r.resource_type,
        r.current_level,
        r.critical_threshold,

        ia.asset_id,
        ia.asset_name,
        ia.asset_type,
        ia.status,

        ad.dependency_type,
        ad.criticality_level,

        dep.asset_name AS dependent_on_asset,

        CASE
            WHEN r.current_level <= r.critical_threshold
            THEN 'AT RISK'

            ELSE 'STABLE'
        END AS simulation_result

    FROM resources r

    JOIN asset_dependencies ad
        ON ad.dependency_type = 'FUEL'

    JOIN infrastructure_assets ia
        ON ad.primary_asset_id = ia.asset_id

    JOIN infrastructure_assets dep
        ON ad.dependent_asset_id = dep.asset_id

    WHERE r.resource_type = 'FUEL'
    """
    
    with connection.cursor() as cursor:
        cursor.execute(query)

        columns = [col[0] for col in cursor.description]

        results = [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]

    return Response(results)


##############################################################from django.db import connection, transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import connection, transaction

@api_view(['GET', 'POST'])
def budget_allocation(request):
    """
    URBS Command Center Financial Router
    Synchronizes full-stack data mutations across constraints cleanly.
    """
    
    # ==========================================
    #  1. WRITE PATH: EXECUTE HANDSHAKE (POST)
    # ==========================================
    if request.method == 'POST':
        event_id = request.data.get('event_id')
        zone_id = request.data.get('zone_id')
        raw_amount = request.data.get('allocated_amount')

        if not event_id or not zone_id or raw_amount is None:
            return Response(
                {"error": "Verification matrix requires valid event_id, zone_id, and allocated_amount vectors."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Cast raw payload value cleanly to type integer to avoid f-string crashes
            allocated_amount = int(raw_amount)
        except (ValueError, TypeError):
            return Response(
                {"error": "allocated_amount must be a valid numeric integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    
                    # FETCH METADATA FOR DYNAMIC ROUTING LABELS
                    cursor.execute(
                        "SELECT event_type, severity_level FROM disaster_events WHERE event_id = %s", 
                        [event_id]
                    )
                    event_meta = cursor.fetchone()
                    if not event_meta:
                        return Response({"error": "Parent infrastructure event context missing."}, status=status.HTTP_404_NOT_FOUND)
                    
                    event_type, severity_level = event_meta

                    # RESOLVE COMPLIANT ROUTING MESSAGES FOR THE DISBURSEMENT LOG
                    if event_type == 'FLOOD':
                        deployment_area = "Emergency Drainage Fleet & Levee Reinforcement"
                    elif event_type == 'PANDEMIC':
                        deployment_area = "Vaccine Cold-Chain Support & Hospital Relief"
                    else:
                        deployment_area = "General Sector Asset Stabilization Logistics"

                    allocation_status = "PRIORITY DISPATCH" if severity_level >= 4 else "RESERVE ALLOCATED"

                    # INSERT INTO NEW VERIFIED TABLE SCHEMA (using allocated_amount column)
                    insert_ledger_query = """
                        INSERT INTO public.budget_disbursements 
                        (event_id, zone_id, allocated_amount, primary_deployment_area, status)
                        VALUES (%s, %s, %s, %s, %s)
                    """
                    cursor.execute(insert_ledger_query, [event_id, zone_id, allocated_amount, deployment_area, allocation_status])

                    # UPDATE SECTOR EVACUATION STATE USING VALID ENUM 'COMPLETED'
                    update_zone_status = """
                        UPDATE disaster_affected_zones 
                        SET evacuation_status = 'COMPLETED' 
                        WHERE event_id = %s AND zone_id = %s
                    """
                    cursor.execute(update_zone_status, [event_id, zone_id])

                    # EVALUATE REMAINING COMPROMISED RUNTIME VECTORS
                    cursor.execute(
                        "SELECT COUNT(*) FROM disaster_affected_zones WHERE event_id = %s AND evacuation_status != 'COMPLETED'", 
                        [event_id]
                    )
                    remaining_count = cursor.fetchone()[0]

                    # FLIP PARENT EVENT STATE UPON GLOBAL RESOLUTION
                    if remaining_count == 0:
                        cursor.execute(
                            "UPDATE disaster_events SET status = 'RESOLVED', end_time = CURRENT_TIMESTAMP WHERE event_id = %s", 
                            [event_id]
                        )

                    # UPDATE INFRASTRUCTURE STATUS NATIVELY TO 'OPERATIONAL'
                    cursor.execute(
                        "UPDATE infrastructure_assets SET status = 'OPERATIONAL' WHERE zone_id = %s", 
                        [zone_id]
                    )

            return Response({
                "status": "SUCCESS",
                "message": f"Successfully calculated and inserted budget disbursement of Rs {allocated_amount:,} for Zone {zone_id}!"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Database transaction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ==========================================
    #  2. READ PATH: AGGREGATION PIPELINE (GET)
    # ==========================================
    elif request.method == 'GET':
        with connection.cursor() as cursor:
            # Task A: Calculate dynamic remaining Treasury Pool from your live table rows
            balance_query = """
                SELECT 150000000 - COALESCE(SUM(allocated_amount), 0) AS live_balance 
                FROM public.budget_disbursements
            """
            cursor.execute(balance_query)
            available_balance = float(cursor.fetchone()[0])

            # Task B: Fetch remaining active grid components
            query = """
                SELECT 
                    de.event_id,
                    de.event_type AS crisis_type,
                    de.severity_level,
                    z.zone_id,
                    z.zone_name,
                    COALESCE(c.total_population, 0) AS zone_population,
                    COALESCE(MAX(dil.damage_description), 'General Regional Damage') AS asset_name,
                    COALESCE(SUM(dil.estimated_repair_cost), 0) AS initial_repair_estimate
                FROM disaster_events de
                JOIN disaster_affected_zones daz ON de.event_id = daz.event_id
                JOIN zones z ON daz.zone_id = z.zone_id
                LEFT JOIN citizens c ON z.zone_id = c.zone_id
                LEFT JOIN infrastructure_assets ia ON z.zone_id = ia.zone_id
                LEFT JOIN disaster_impact_log dil ON de.event_id = dil.event_id AND ia.asset_id = dil.asset_id
                WHERE de.status = 'ACTIVE' AND daz.evacuation_status != 'COMPLETED'
                GROUP BY 
                    de.event_id, 
                    de.event_type, 
                    de.severity_level, 
                    z.zone_id, 
                    z.zone_name, 
                    c.total_population
                ORDER BY de.event_id ASC, z.zone_id ASC
            """
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            raw_rows = cursor.fetchall()
            
            processed_needs = []
            for row in raw_rows:
                incident = dict(zip(columns, row))
                base_estimate = float(incident["initial_repair_estimate"])
                
                if base_estimate > 0:
                    calculated_need = base_estimate
                else:
                    pop = incident["zone_population"]
                    severity = incident["severity_level"]
                    calculated_need = (pop * 150) + (severity * 2000000)
                
                incident["required_capital"] = round(calculated_need, 2)
                processed_needs.append(incident)
                
        # Return object layout matching the frontend expected payload shape
        return Response({
            "available_balance": available_balance,
            "disasters": processed_needs
        }, status=status.HTTP_200_OK)
    
#####################################################################

from django.http import JsonResponse
from rest_framework.decorators import api_view
from .neo4j_service import get_live_graph_network

@api_view(['GET'])
def graph_network_view(request):
    """API endpoint that feeds the React interface with Neo4j map data."""
    try:
        data = get_live_graph_network()
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
######################################################################

from rest_framework.decorators import api_view
from django.http import JsonResponse
from .neo4j_service import get_shortest_path

@api_view(['GET'])
def shortest_path_view(request):
    """API endpoint that accepts start and end parameters and returns the path matrix."""
    start_id = request.GET.get('start')
    end_id = request.GET.get('end')
    
    if not start_id or not end_id:
        return JsonResponse({"error": "Missing origin or destination parameters"}, status=400)
        
    try:
        path_data = get_shortest_path(start_id, end_id)
        return JsonResponse(path_data, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    

    ###################################################33

# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.core.mail import send_mail
from .models import PasswordResetOTP
import random

@api_view(['POST'])
def admin_login_view(request):
    """Authenticates pre-seeded admins."""
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None and user.is_staff: # Ensure only admins can log in
        login(request, user)
        return Response({"message": "Authentication successful", "username": user.username}, status=200)
    else:
        return Response({"error": "Invalid credentials or unauthorized access."}, status=401)

@api_view(['POST'])
def request_otp_view(request):
    """Generates and emails a 6-digit OTP."""
    email = request.data.get('email')
    
    try:
        user = User.objects.get(email=email, is_staff=True)
        # Generate 6-digit code
        otp = str(random.randint(100000, 999999))
        
        # Save to database
        PasswordResetOTP.objects.create(user=user, otp_code=otp)
        
        # Dispatch Email
        send_mail(
            subject='URBS Security: Password Reset Authorization Code',
            message=f'Your administrative password reset code is: {otp}\n\nThis code expires in 10 minutes.',
            from_email='security@urbs-system.local',
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({"message": "If the email exists, an OTP has been dispatched."}, status=200)
        
    except User.DoesNotExist:
        # Return success anyway to prevent email enumeration attacks
        return Response({"message": "If the email exists, an OTP has been dispatched."}, status=200)

@api_view(['POST'])
def verify_and_reset_view(request):
    """Verifies the OTP and updates the password."""
    email = request.data.get('email')
    otp_code = request.data.get('otp_code')
    new_password = request.data.get('new_password')
    
    try:
        user = User.objects.get(email=email)
        # Get the most recent OTP for this user
        otp_record = PasswordResetOTP.objects.filter(user=user, otp_code=otp_code).latest('created_at')
        
        if not otp_record.is_valid():
            return Response({"error": "OTP has expired."}, status=400)
            
        if otp_record.is_verified:
            return Response({"error": "OTP has already been used."}, status=400)
            
        # Success: Reset the password
        user.set_password(new_password)
        user.save()
        
        # Mark OTP as used
        otp_record.is_verified = True
        otp_record.save()
        
        return Response({"message": "Password successfully synchronized. You may now log in."}, status=200)
        
    except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
        return Response({"error": "Invalid OTP or email."}, status=400)
    
#############################################################################

import random
import traceback
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import InfrastructureAssets, AssetDependencies

@api_view(['GET'])
def dynamic_postgres_asset_graph_view(request):
    try:
        # 1. Fetch data from PostgreSQL
        assets = InfrastructureAssets.objects.all()
        dependencies = AssetDependencies.objects.all()
        
        react_nodes = []
        react_edges = []
        
        # 2. Map Assets safely to React Flow Nodes
        # 2. Map Assets safely to React Flow Nodes
        for asset in assets:
            # Safe status check to avoid attribute failures
            status_val = getattr(asset, 'status', 'OPERATIONAL')
            
            border_color = "#01411C"  # Default green
            if status_val == "DEGRADED":
                border_color = "#F0AD4E"
            elif status_val == "OFFLINE":
                border_color = "#D9534F"
            elif status_val == "MAINTENANCE":
                border_color = "#0275D8"
                
            # 🏷️ SMART LABEL SCAN: Checks asset_name first, then name, then falls back to ID
            asset_label = None
            for attr in ['asset_name', 'name', 'label', 'asset_id']:
                val = getattr(asset, attr, None)
                if val:
                    asset_label = str(val)
                    break
            if not asset_label:
                asset_label = "Unknown Asset"

            # Bulletproof Zone Display Parsing
            zone_display = "Unassigned"
            zone_obj = getattr(asset, 'zone', None)
            if zone_obj:
                if hasattr(zone_obj, 'name'):
                    zone_display = str(zone_obj.name)
                elif hasattr(zone_obj, 'zone_name'):
                    zone_display = str(zone_obj.zone_name)
                else:
                    zone_display = str(zone_obj)
            
            # Explicitly cast capacity to float/str to prevent Decimal serialization 500 errors
            capacity_val = getattr(asset, 'capacity', 0)
            if capacity_val is not None:
                try:
                    capacity_val = float(capacity_val)
                except (TypeError, ValueError):
                    capacity_val = str(capacity_val)

            react_nodes.append({
                "id": str(getattr(asset, 'asset_id', '')), 
                "type": "default",
                "position": {"x": random.randint(100, 900), "y": random.randint(100, 600)},
                "data": {
                    "label": asset_label,  # 🎉 Now holds the real text name or asset identifier
                    "zone": zone_display,
                    "asset_type": str(getattr(asset, 'asset_type', 'Unknown')),
                    "status": str(status_val),
                    "capacity": capacity_val,
                },
                "style": {
                    "border": f"2px solid {border_color}",
                    "padding": "10px",
                    "borderRadius": "8px",
                    "backgroundColor": "#FFFFFF",
                    "color": "#333333",
                    "fontWeight": "bold",
                    "fontSize": "12px",
                    "width": 180
                }
            })

        # 3. Map Dependencies safely to React Flow Edges
        for index, dep in enumerate(dependencies):
            # Scan for any variations of ForeignKey tracking naming conventions
            supplier_id = "unknown"
            for attr in ['dependent_asset_id_id', 'dependent_asset_id', 'dependent_asset']:
                val = getattr(dep, attr, None)
                if val is not None:
                    supplier_id = str(getattr(val, 'asset_id', val))
                    break
                    
            consumer_id = "unknown"
            for attr in ['primary_asset_id_id', 'primary_asset_id', 'primary_asset']:
                val = getattr(dep, attr, None)
                if val is not None:
                    consumer_id = str(getattr(val, 'asset_id', val))
                    break

            dep_type = str(getattr(dep, 'dependency_type', 'GENERAL'))
            is_critical = getattr(dep, 'criticality_level', 'NORMAL') == "CRITICAL"
            
            edge_color = "#01411C" 
            if dep_type == "POWER":
                edge_color = "#FFC107" 
            elif dep_type == "WATER":
                edge_color = "#17A2B8" 
            elif dep_type == "FUEL":
                edge_color = "#E83E8C" 
                
            dep_id_val = getattr(dep, 'dependency_id', index)
            
            react_edges.append({
                "id": f"edge-{dep_id_val}",
                "source": supplier_id, 
                "target": consumer_id,
                "label": dep_type,
                "animated": is_critical, 
                "style": {
                    "stroke": "#D9534F" if (is_critical and edge_color == "#01411C") else edge_color,
                    "strokeWidth": 3 if is_critical else 1.5
                },
                "labelStyle": { "fill": "#333333", "fontWeight": 700, "fontSize": "10px" }
            })

        return Response({
            "nodes": react_nodes,
            "edges": react_edges
        }, status=200)

    except Exception as e:
        # 🚨 THE DIAGNOSTIC LIFELINE: Prints the exact breaking line directly to your console window!
        print("\n" + "!"*60)
        print("🔍 SENTINEL GRAPH TRACE DIAGNOSTICS:")
        traceback.print_exc()
        print("!"*60 + "\n")
        
        return Response({
            "error": str(e),
            "help": "Check your running python manage.py runserver console window to see the exact crash line trace."
        }, status=500)

######################################################################3

import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Core infrastructure and zone models
from .models import InfrastructureAssets, AssetDependencies, Zones

# Connect to your actual working MongoDB connection manager utility
from .mongo_utils import get_mongo_collection

@api_view(['POST'])
def run_zone_impact_simulation(request):
    """
    Simulates an infrastructure failure cascade. Traces all downstream assets 
    dependent on the selected provider and groups them by urban zone.
    """
    target_asset_id = request.data.get("asset_id") 
    
    if not target_asset_id:
        return Response({"error": "Missing 'asset_id' parameter."}, status=400)
    
    try:
        # 1. Verify the starting core asset exists
        root_asset = InfrastructureAssets.objects.get(asset_id=target_asset_id)
        dependencies = list(AssetDependencies.objects.all())
        
        # 2. Trace cascading failures downstream (Using your exact working sequence)
        broken_asset_ids = {str(target_asset_id)}
        
        # Loop to catch deep dependency chains (e.g., Power Grid -> Water Pump -> Treatment Facility)
        for _ in range(3): 
            for dep in dependencies:
                # Safely read foreign key values whether they return string IDs or model instances
                s_val = dep.dependent_asset_id
                supplier_id = str(getattr(s_val, 'asset_id', s_val))
                
                c_val = dep.primary_asset_id
                consumer_id = str(getattr(c_val, 'asset_id', c_val))
                
                if supplier_id in broken_asset_ids:
                    broken_asset_ids.add(consumer_id)
                    
        # 3. Group broken infrastructure assets into their respective zones
        zone_map = {}
        for asset_id in broken_asset_ids:
            try:
                asset_obj = InfrastructureAssets.objects.get(asset_id=asset_id)
            except InfrastructureAssets.DoesNotExist:
                continue
            
            # Safely resolve the associated zone relation
            zone_obj = getattr(asset_obj, 'zone', getattr(asset_obj, 'zone_id', None))
            
            if not zone_obj or isinstance(zone_obj, (str, int)):
                z_id = str(zone_obj) if zone_obj else "unknown"
                try:
                    zone_obj = Zones.objects.get(zone_id=z_id)
                except Zones.DoesNotExist:
                    continue
            
            z_id = str(getattr(zone_obj, 'zone_id', zone_obj))
            z_name = getattr(zone_obj, 'zone_name', getattr(zone_obj, 'name', f"Zone {z_id}"))
            
            if z_id not in zone_map:
                zone_map[z_id] = {
                    "zone_id": z_id,
                    "zone_name": z_name,
                    "disabled_assets": []
                }
            
            # Append asset details to the zone's outage list
            zone_map[z_id]["disabled_assets"].append({
                "asset_id": asset_obj.asset_id,
                "name": asset_obj.asset_name,
                "type": asset_obj.asset_type
            })

        affected_zones_list = list(zone_map.values())
        
        # 4. Save simulation state document directly into MongoDB
        mongo_document = {
            "timestamp": datetime.datetime.utcnow(),
            "simulated_disaster_source": {
                "provider_id": root_asset.asset_id,
                "name": root_asset.asset_name,
                "type": root_asset.asset_type
            },
            "impact_tree": affected_zones_list
        }
        
        # Safely insert into MongoDB using the imported connector utility
        simulation_id_str = "dev_simulation_log"
        try:
            collection = get_mongo_collection("zone_disaster_snapshots")
            if collection is not None:
                inserted_id = collection.insert_one(mongo_document).inserted_id
                simulation_id_str = str(inserted_id)
        except Exception as e:
            print(f"MongoDB Snapshot Sync Log Failure: {e}")
        
        return Response({
            "simulation_id": simulation_id_str,
            "red_zone_ids": list(zone_map.keys()), 
            "impact_tree": affected_zones_list     
        }, status=200)

    except InfrastructureAssets.DoesNotExist:
        return Response({"error": f"Asset '{target_asset_id}' not found."}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
from django.db.models import Q

@api_view(['GET'])
def get_infrastructure_assets(request):
    """
    Feeds the Macro-Urban dashboard select dropdown.
    Filters out consumers (hospitals, schools) to only show primary utility providers.
    """
    # 1. Define exact type matches based on your DB seeding schema
    core_utility_types = ['POWER_STATION', 'WATER_PLANT', 'FUEL_STORAGE', 'GENERATOR', 'GRID']
    
    # 2. Query with a broad fallback matching 'power', 'water', or 'fuel' in the type text
    assets = InfrastructureAssets.objects.filter(
        Q(asset_type__in=core_utility_types) |
        Q(asset_type__icontains='power') |
        Q(asset_type__icontains='water') |
        Q(asset_type__icontains='fuel')
    ).values('asset_id', 'asset_name', 'asset_type', 'status')
    
    return Response(list(assets))


#############################################################################################

from django.db import transaction
from .models import RefillLogs, Resources
from .serializers import RefillLogSerializer

@api_view(['GET', 'POST'])
def refill_resource_view(request):
    # 1. READ PATH: Fetch historical audit trails
    if request.method == 'GET':
        logs = RefillLogs.objects.all().order_by('-refill_date')
        serializer = RefillLogSerializer(logs, many=True)
        return Response(serializer.data, status=200)

    # 2. WRITE PATH: Record a new refill transaction
    elif request.method == 'POST':
        resource_id = request.data.get('resource_id')
        refill_amount = request.data.get('refill_amount')
        refill_cost = request.data.get('refill_cost')
        notes = request.data.get('operator_notes', 'Emergency refill authorized.')

        if not resource_id or refill_amount is None or refill_cost is None:
            return Response({"error": "Missing parameters."}, status=400)

        try:
            with transaction.atomic():
                # Fetch target resource
                resource = Resources.objects.get(resource_id=resource_id)
                
                # Create the log entry
                log_entry = RefillLogs.objects.create(
                    resource=resource,
                    refill_amount=float(refill_amount),
                    refill_cost=float(refill_cost),
                    operator_notes=notes
                )

                # Reset the resource current level in database back to full
                resource.current_level = float(resource.current_level) + float(refill_amount)
                if resource.current_level > resource.max_capacity:
                    resource.current_level = resource.max_capacity
                resource.save()

            return Response({
                "message": f"Successfully refilled {resource_id}. Resource synchronized.",
                "data": RefillLogSerializer(log_entry).data
            }, status=201)

        except Resources.DoesNotExist:
            return Response({"error": "Resource node not found."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
########################################################################################

@api_view(['GET', 'POST'])
def telemetry_console_view(request):
    """
    Coordinates MongoDB real-time telemetry and emergency broadcast notifications.
    """
    telemetry_col = get_mongo_collection("disaster_telemetry")
    broadcasts_col = get_mongo_collection("emergency_broadcasts")

    # 1. READ PATH: Fetch current sensors and latest broadcasts
    if request.method == 'GET':
        # Retrieve active event-zone pairs and their initial PostgreSQL water levels
        from django.db import connection
        query = """
        SELECT daz.event_id, daz.zone_id, daz.current_water_level_cm 
        FROM disaster_affected_zones daz
        JOIN disaster_events de ON daz.event_id = de.event_id
        WHERE de.status = 'ACTIVE' 
          AND daz.evacuation_status != 'COMPLETED'
        """
        with connection.cursor() as cursor:
            cursor.execute(query)
            active_pairs = cursor.fetchall()

        # If no active events exist, return empty sensors
        if not active_pairs:
            telemetry_docs = []
        else:
            # Match documents that correspond to active event-zone pairs in MongoDB
            or_clauses = [{"event_id": int(item[0]), "zone_id": str(item[1])} for item in active_pairs]
            existing_docs = {f"{doc['event_id']}_{doc['zone_id']}": doc for doc in telemetry_col.find({"$or": or_clauses}, {"_id": 0})}
            
            telemetry_docs = []
            for event_id, zone_id, pg_water_level in active_pairs:
                key = f"{event_id}_{zone_id}"
                if key in existing_docs:
                    telemetry_docs.append(existing_docs[key])
                else:
                    # Initialize missing MongoDB telemetry using PostgreSQL starting value
                    initial_val = float(pg_water_level or 0.0)
                    new_doc = {
                        "event_id": int(event_id),
                        "zone_id": str(zone_id),
                        "telemetry": {"water_level_cm": initial_val},
                        "history": [initial_val, initial_val],
                        "demographics": {"elderly_population": 120, "children_population": 60}
                    }
                    telemetry_col.insert_one(new_doc)
                    new_doc.pop("_id", None)
                    telemetry_docs.append(new_doc)

        # Ensure the history array is initialized with at least 2 points if it doesn't exist
        for doc in telemetry_docs:
            if "history" not in doc or not isinstance(doc["history"], list) or len(doc["history"]) < 2:
                lvl = doc.get("telemetry", {}).get("water_level_cm", 0.0)
                doc["history"] = [lvl, lvl]
        
        # Retrieve latest 15 broadcasts
        broadcast_docs = list(broadcasts_col.find({}, {"_id": 0}).sort("timestamp", -1).limit(15))
        
        return Response({
            "sensors": telemetry_docs,
            "broadcasts": broadcast_docs
        }, status=200)

    # 2. WRITE PATH: Update sensor values or create new broadcasts
    elif request.method == 'POST':
        action = request.data.get('action')

        if action == 'update_sensor':
            zone_id = request.data.get('zone_id')
            water_level = request.data.get('water_level')

            if not zone_id or water_level is None:
                return Response({"error": "Missing parameters zone_id or water_level."}, status=400)

            # Update the specific document matching zone_id in MongoDB and push to trend history
            result = telemetry_col.update_one(
                {"zone_id": zone_id},
                {
                    "$set": {"telemetry.water_level_cm": float(water_level)},
                    "$push": {
                        "history": {
                            "$each": [float(water_level)],
                            "$slice": -12  # Capped at last 12 readings
                        }
                    }
                }
            )

            if result.matched_count == 0:
                # Fallback: if document doesn't exist, insert a fresh one
                telemetry_col.insert_one({
                    "event_id": 1, # Default mock event context
                    "zone_id": zone_id,
                    "telemetry": { "water_level_cm": float(water_level) },
                    "history": [float(water_level)],
                    "demographics": { "elderly_population": 150, "children_population": 80 }
                })

            return Response({"message": f"Sensor for {zone_id} successfully synchronized in MongoDB."}, status=200)

        elif action == 'create_broadcast':
            message = request.data.get('message')
            severity = request.data.get('severity', 'INFO').upper()
            zone_id = request.data.get('zone_id', 'GLOBAL')

            if not message:
                return Response({"error": "Broadcast message cannot be empty."}, status=400)

            # Insert new broadcast document into MongoDB
            new_broadcast = {
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "zone_id": zone_id,
                "message": message,
                "severity": severity,
                "operator": "admin"
            }
            broadcasts_col.insert_one(new_broadcast)
            
            # Remove MongoDB Object ID to make it JSON serializable
            new_broadcast.pop('_id', None)

            return Response({
                "message": "Emergency alert broadcast successfully saved to MongoDB.",
                "broadcast": new_broadcast
            }, status=201)

        else:
            return Response({"error": "Invalid action parameter."}, status=400)
        
###########################################################################################

from django.db.models import Sum
from .models import DisasterEvents, DisasterAffectedZones, Citizens, Resources, ResourceConsumptionLog, EvacuationPlans, Zones, InfrastructureAssets
from .serializers import EvacuationPlanSerializer
from core.mongo_utils import get_mongo_collection
from core.neo4j_service import neo4j_db
import math

@api_view(['GET'])
def get_active_disaster_events(request):
    """Retrieves all active disaster events to populate the frontend selection drop-down."""
    active_events = DisasterEvents.objects.filter(status='ACTIVE')
    data = [{"event_id": e.event_id, "event_type": e.event_type, "severity_level": e.severity_level} for e in active_events]
    return Response(data, status=200)

@api_view(['GET'])
def list_evacuation_plans(request):
    """Retrieves all cached evacuation plans from PostgreSQL."""
    plans = EvacuationPlans.objects.all().order_by('-plan_id')
    serializer = EvacuationPlanSerializer(plans, many=True)
    return Response(serializer.data, status=200)

@api_view(['POST'])
def generate_evacuation_plan_view(request):
    """
    Automated Emergency Command Brain:
    Unifies PostgreSQL, MongoDB, and Neo4j to compile a dynamic safe routing paths & 72-hour audit checklist.
    Checks remaining resource capacities in the specific target destination zones.
    """
    event_id = request.data.get('event_id')
    if not event_id:
        return Response({"error": "Missing 'event_id' parameter."}, status=400)

    try:
        # Step 1: Extract ground truth from PostgreSQL
        event = DisasterEvents.objects.get(event_id=event_id)
        affected_zones = list(DisasterAffectedZones.objects.filter(event_id=event_id))
        
        if not affected_zones:
            return Response({"error": "No affected zones registered for this active disaster."}, status=400)
            
        affected_zone_ids = [az.zone_id for az in affected_zones]

        # Step 2: Query Live Road Obstacles & Submerged Zones from MongoDB
        # A. Find explicitly blocked roads
        obstacles_col = get_mongo_collection("road_obstacles")
        blocked_roads = list(obstacles_col.find({"status": {"$in": ["BLOCKED", "FLOODED"]}}))
        blocked_edges = set()
        for road in blocked_roads:
            if 'source' in road and 'target' in road:
                blocked_edges.add((road['source'], road['target']))
                blocked_edges.add((road['target'], road['source'])) # Bidirectional safety

        # B. Check for flooded zones (height >= 120cm)
        telemetry_col = get_mongo_collection("disaster_telemetry")
        flooded_docs = list(telemetry_col.find({"telemetry.water_level_cm": {"$gte": 120.0}}))
        blocked_zone_ids = set([doc['zone_id'] for doc in flooded_docs if 'zone_id' in doc])

        # Step 3: Run pathfinding algorithm on Neo4j Graph
        # A. Identify safe target zones (those NOT affected by the active crisis)
        all_zones = list(Zones.objects.all())
        safe_zones = [z for z in all_zones if z.zone_id not in affected_zone_ids and z.zone_id not in blocked_zone_ids]
        safe_zone_ids = [sz.zone_id for sz in safe_zones]

        if not safe_zone_ids:
            return Response({"error": "System Error: No safe zones available in Lahore network grid."}, status=500)

        evacuation_routes = []
        target_zones = set()
        
        # B. Run shortestPath in Neo4j for each affected zone, excluding blocked nodes (allowing start node)
        for start_id in affected_zone_ids:
            cypher = """
            MATCH (start:Zone {id: $start_id}), (end:Zone)
            WHERE end.id IN $safe_zone_ids
            MATCH p = shortestPath((start)-[:CONNECTS_TO*..20]-(end))
            WHERE all(node in nodes(p) WHERE node.id = $start_id OR not node.id IN $blocked_zone_ids)
            RETURN 
                end.id AS safe_zone_id,
                end.name AS safe_zone_name,
                [node in nodes(p) | node.id] AS path_node_ids,
                reduce(s = 0, rel in relationships(p) | s + toFloat(rel.distance)) AS total_distance
            ORDER BY total_distance ASC
            LIMIT 1
            """
            
            params = {
                "start_id": str(start_id),
                "safe_zone_ids": safe_zone_ids,
                "blocked_zone_ids": list(blocked_zone_ids)
            }
            
            result = neo4j_db.query(cypher, params)
            
            if result and result[0]['path_node_ids']:
                distance = round(float(result[0]['total_distance']), 1)
                est_time = int(distance * 2) # Est 2 minutes per distance unit
                target_zone_id = result[0]['safe_zone_id']
                target_zones.add(target_zone_id)

                evacuation_routes.append({
                    "origin_zone": start_id,
                    "target_zone": target_zone_id,
                    "shelter_name": (result[0]['safe_zone_name'] or f"Zone {target_zone_id}") + " Safe Shelter",
                    "path": result[0]['path_node_ids'],
                    "distance_km": distance,
                    "time_minutes": est_time
                })
            else:
                # Fallback path if graph routes are fully cut off by obstacles
                evacuation_routes.append({
                    "origin_zone": start_id,
                    "target_zone": "UNREACHABLE",
                    "shelter_name": "GRID CUTOFF (Awaiting Heli-evac)",
                    "path": [],
                    "distance_km": 0,
                    "time_minutes": 0
                })

        # Step 4: 72-Hour Survival Audit (Target Zone Local Asset Capacities)
        # A. Calculate total fleeing population
        total_evacuees = 0
        total_elderly = 0
        total_mobility = 0
        for zid in affected_zone_ids:
            citizen_data = Citizens.objects.filter(zone_id=zid).order_by('-record_date').first()
            if citizen_data:
                total_evacuees += citizen_data.total_population
                total_elderly += (citizen_data.elderly_count or 0)
                total_mobility += (citizen_data.mobility_impaired_count or 0)

        # B. Calculate per-capita daily consumption factors from PostgreSQL logs
        DEFAULTS = {
            'WATER': 5.0,     # Liters/person/day
            'FOOD': 0.002,    # Tons/person/day
            'MEDICAL': 0.1,   # Units/person/day
            'FUEL': 0.5       # Liters/person/day
        }
        
        # Calculate city-wide population for per-capita division
        city_pop = Citizens.objects.aggregate(total=Sum('total_population'))['total'] or 500000

        survival_checklist = []
        verdict = "GO"

        resources = Resources.objects.all()
        for res in resources:
            res_type = res.resource_type.upper()
            
            # Sum historic logs to find average daily consumption
            logs = ResourceConsumptionLog.objects.filter(resource_id=res.resource_id)
            total_logged = logs.aggregate(total=Sum('consumed_amount'))['total']
            unique_dates = logs.values('log_date').distinct().count() or 1
            
            if total_logged and unique_dates:
                daily_city_avg = total_logged / unique_dates
                per_capita_daily = daily_city_avg / city_pop
            else:
                per_capita_daily = DEFAULTS.get(res_type, 1.0)

            # Multiply by total evacuees and by 3 days (72 hours)
            required_amount = round(per_capita_daily * total_evacuees * 3, 1)

            # C. Fetch remaining capacities of assets in target zones
            local_capacity = 0
            assets = InfrastructureAssets.objects.filter(zone_id__in=list(target_zones))
            
            if res_type == 'WATER':
                water_assets = assets.filter(asset_type='WATER_PLANT')
                local_capacity = sum((a.max_capacity - a.current_capacity) for a in water_assets)
            elif res_type == 'FUEL':
                fuel_assets = assets.filter(asset_type='FUEL_DEPOT')
                local_capacity = sum((a.max_capacity - a.current_capacity) for a in fuel_assets)
            elif res_type == 'MEDICAL':
                medical_assets = assets.filter(asset_type='HOSPITAL')
                local_capacity = sum((a.max_capacity - a.current_capacity) for a in medical_assets)

            # Fallback to global warehouse stock if no local target capacities are set
            if local_capacity <= 0:
                local_capacity = res.current_level
            
            deficit = max(0.0, round(required_amount - local_capacity, 1))
            status = "ADEQUATE" if deficit == 0 else "DEFICIT"
            
            if status == "DEFICIT":
                verdict = "NO-GO"

            survival_checklist.append({
                "resource_id": res.resource_id,
                "resource_type": res_type,
                "unit": res.measurement_unit,
                "current_stock": local_capacity,  # Shows remaining capacity at target shelters
                "required_amount": required_amount,
                "status": status,
                "deficit": deficit
            })

        # Step 5: Cache generated plans back to PostgreSQL table
        for route in evacuation_routes:
            if route["target_zone"] == "UNREACHABLE":
                continue
            
            origin_zone_obj = Zones.objects.get(zone_id=route["origin_zone"])
            EvacuationPlans.objects.create(
                zone=origin_zone_obj,
                disaster_type=event.event_type,
                primary_route_id="-".join(route["path"]),
                assembly_point_name=route["shelter_name"],
                estimated_evacuation_time_minutes=route["time_minutes"],
                status='ACTIVE'
            )

        # Consolidate payload response
        return Response({
            "disaster_profile": {
                "event_id": event.event_id,
                "event_type": event.event_type,
                "severity": event.severity_level,
                "affected_zones": affected_zone_ids
            },
            "evacuation_routes": evacuation_routes,
            "survival_audit": {
                "total_evacuees": total_evacuees,
                "total_elderly": total_elderly,
                "total_mobility_impaired": total_mobility,
                "checklist": survival_checklist,
                "verdict": verdict
            }
        }, status=200)

    except DisasterEvents.DoesNotExist:
        return Response({"error": "Event target not found in database."}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)