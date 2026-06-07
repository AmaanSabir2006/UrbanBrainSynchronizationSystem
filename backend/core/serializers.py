from rest_framework import serializers
from .models import Zones


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zones
        fields = '__all__'
        
from .models import RefillLogs

class RefillLogSerializer(serializers.ModelSerializer):
    resource_type = serializers.CharField(source='resource.resource_type', read_only=True)
    
    class Meta:
        model = RefillLogs
        fields = ['refill_id', 'resource_id', 'resource_type', 'refill_date', 'refill_amount', 'refill_cost', 'operator_notes']

from .models import EvacuationPlans

class EvacuationPlanSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.zone_name', read_only=True)
    
    class Meta:
        model = EvacuationPlans
        fields = [
            'plan_id', 
            'zone', 
            'zone_name', 
            'disaster_type', 
            'primary_route_id', 
            'assembly_point_name', 
            'estimated_evacuation_time_minutes', 
            'status'
        ]