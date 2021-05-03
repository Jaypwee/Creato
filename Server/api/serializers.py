from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Token, Subscription, Balance, CreatoUser

class TokenSerializers(serializers.ModelSerializer):
    class Meta:
        model = Token
        fields = ['uuid', 'name', 'created_at', 'updated_at', 'issueLimit', 'subscribedAmount', 'price', 'isListed', 'isIssued']
        read_only_fields = ['uuid', 'created_at']

class BalanceSerializers(serializers.ModelSerializer):
    token = TokenSerializers(read_only=True)
    class Meta:
        model = Balance
        fields = ['token', 'amount']


class CreatoUserSerializers(serializers.ModelSerializer):
    balance = BalanceSerializers()
    class Meta:
        model = CreatoUser
        fields = ['balance', 'usdBalance']

class UserSerializers(serializers.ModelSerializer):
    creatouser = CreatoUserSerializers()

    class Meta:
        model = User
        fields = ['username', 'creatouser']


class SubscriptionSerializers(serializers.ModelSerializer):
    token = TokenSerializers()
    user = UserSerializers()

    class Meta:
        model = Subscription
        fields = ['uuid', 'created_at', 'updated_at', 'amount', 'token', 'user']
        read_only = ['created_at', 'updated_at']



