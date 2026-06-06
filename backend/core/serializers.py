from rest_framework import serializers
from .models import Zones


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zones
        fields = '__all__'