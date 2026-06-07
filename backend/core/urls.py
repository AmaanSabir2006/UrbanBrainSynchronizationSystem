from django.urls import path
from .views import home,get_zones,resource_forecast,disaster_impact_assessment,fuel_failure_simulation,budget_allocation,get_live_graph_network,graph_network_view,shortest_path_view,verify_and_reset_view,admin_login_view,request_otp_view,dynamic_postgres_asset_graph_view,run_zone_impact_simulation,get_infrastructure_assets,refill_resource_view,telemetry_console_view,get_active_disaster_events,list_evacuation_plans,generate_evacuation_plan_view

urlpatterns = [
    path('', home),
    path('zones/',get_zones),
    path('resource-forecast/', resource_forecast),
    path('disaster_impact/',disaster_impact_assessment),
    path('fuel_failure/',fuel_failure_simulation),
    path('budget_allocation/',budget_allocation),
    path('zones_graph/', graph_network_view),
    path('shortest-path/', shortest_path_view),
    path('auth/reset-password/', verify_and_reset_view),
    path('auth/login/',admin_login_view),
    path('auth/request-otp/', request_otp_view),
    path('assets_graph/',dynamic_postgres_asset_graph_view),
    path('zone_impact/',run_zone_impact_simulation),
    path('infrastructure-assets/', get_infrastructure_assets),
    path('resource-refill/',refill_resource_view),
    path('telemetry-console/',telemetry_console_view),
     path('active-events/', get_active_disaster_events),
    path('evacuation-plans/', list_evacuation_plans),
    path('evacuation-plans/generate/', generate_evacuation_plan_view),
]