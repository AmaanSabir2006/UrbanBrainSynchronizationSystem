from django.db import models


class AssetDependencies(models.Model):
    dependency_id = models.AutoField(primary_key=True)
    primary_asset = models.ForeignKey('InfrastructureAssets', models.DO_NOTHING, blank=True, null=True)
    dependent_asset = models.ForeignKey('InfrastructureAssets', models.DO_NOTHING, related_name='assetdependencies_dependent_asset_set', blank=True, null=True)
    dependency_type = models.CharField(max_length=50, blank=True, null=True)
    criticality_level = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'asset_dependencies'


class Citizens(models.Model):
    entry_id = models.AutoField(primary_key=True)
    zone = models.ForeignKey('Zones', models.DO_NOTHING)
    total_population = models.IntegerField()
    elderly_count = models.IntegerField(blank=True, null=True)
    mobility_impaired_count = models.IntegerField(blank=True, null=True)
    record_date = models.DateField()
    notes = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'citizens'


class DisasterAffectedZones(models.Model):
    affected_id = models.AutoField(primary_key=True)
    event = models.ForeignKey('DisasterEvents', models.DO_NOTHING, blank=True, null=True)
    zone = models.ForeignKey('Zones', models.DO_NOTHING, blank=True, null=True)
    impact_start_time = models.DateTimeField(blank=True, null=True)
    evacuation_status = models.CharField(max_length=20, blank=True, null=True)
    current_water_level_cm = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'disaster_affected_zones'


class DisasterEvents(models.Model):
    event_id = models.AutoField(primary_key=True)
    event_type = models.CharField(max_length=50, blank=True, null=True)
    severity_level = models.IntegerField(blank=True, null=True)
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'disaster_events'


class DisasterImpactLog(models.Model):
    impact_id = models.AutoField(primary_key=True)
    event = models.ForeignKey(DisasterEvents, models.DO_NOTHING, blank=True, null=True)
    asset = models.ForeignKey('InfrastructureAssets', models.DO_NOTHING, blank=True, null=True)
    damage_description = models.TextField(blank=True, null=True)
    estimated_repair_cost = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    recovery_priority = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'disaster_impact_log'



class EvacuationPlans(models.Model):
    plan_id = models.AutoField(primary_key=True)
    zone = models.ForeignKey('Zones', models.DO_NOTHING, blank=True, null=True)
    disaster_type = models.CharField(max_length=50, blank=True, null=True)
    primary_route_id = models.CharField(max_length=50, blank=True, null=True)
    assembly_point_name = models.CharField(max_length=100, blank=True, null=True)
    estimated_evacuation_time_minutes = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'evacuation_plans'


class InfrastructureAssets(models.Model):
    asset_id = models.CharField(primary_key=True, max_length=15)
    zone = models.ForeignKey('Zones', models.DO_NOTHING, blank=True, null=True)
    asset_name = models.CharField(max_length=100)
    asset_type = models.CharField(max_length=50, blank=True, null=True)
    current_capacity = models.IntegerField(blank=True, null=True)
    max_capacity = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    fuel_requirement_liters_per_day = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'infrastructure_assets'


class ResourceConsumptionLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    resource = models.ForeignKey('Resources', models.DO_NOTHING, blank=True, null=True)
    zone = models.ForeignKey('Zones', models.DO_NOTHING, blank=True, null=True)
    log_date = models.DateField()
    consumed_amount = models.FloatField()
    notes = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'resource_consumption_log'


class Resources(models.Model):
    resource_id = models.CharField(primary_key=True, max_length=10)
    resource_type = models.CharField(max_length=50)
    measurement_unit = models.CharField(max_length=20)
    current_level = models.FloatField()
    max_capacity = models.FloatField()
    critical_threshold = models.FloatField()

    class Meta:
        managed = False
        db_table = 'resources'


class Zones(models.Model):
    zone_id = models.CharField(primary_key=True, max_length=10)
    zone_name = models.CharField(max_length=100)
    area_sqkm = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    population_count = models.IntegerField(blank=True, null=True)
    risk_classification = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'zones'

# models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import datetime

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_valid(self):
        # OTP expires after 10 minutes (600 seconds)
        expiration_time = self.created_at + datetime.timedelta(minutes=10)
        return timezone.now() <= expiration_time

    def __str__(self):
        return f"OTP for {self.user.username} - {self.otp_code}"