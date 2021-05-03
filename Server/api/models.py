from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
import uuid

# Create your models here

class Token(models.Model):
    uuid = models.CharField(max_length=64, unique=True, default=uuid.uuid4());
    name = models.CharField(max_length=60)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    issueLimit = models.BigIntegerField(default=0)
    subscribedAmount = models.PositiveBigIntegerField(default=0)
    price = models.FloatField(default=0)
    isIssued = models.BooleanField(default=False)
    isListed = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Subscription(models.Model):
    SUBSCRIBED = 'subscribed'
    ISSUED = 'issued'
    SUBSCRIPTION_STATUS = [
        (SUBSCRIBED, 'subscribed'),
        (ISSUED, 'issued')
    ]

    uuid = models.CharField(max_length=64, primary_key=True, unique=True, default=uuid.uuid4())
    amount = models.PositiveBigIntegerField(default=0)
    status = models.CharField(max_length=60, choices=SUBSCRIPTION_STATUS, default=SUBSCRIBED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    token = models.ForeignKey('Token', on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)


class Balance(models.Model):
    token = models.ForeignKey('Token', on_delete=models.CASCADE)
    amount = models.PositiveBigIntegerField(default=0)

class CreatoUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    balance = models.OneToOneField(Balance, null=True, blank=True, on_delete=models.CASCADE)
    usdBalance = models.PositiveBigIntegerField(default=0)
    # subscriptions = models.OneToOneField(Subscription, null=True, blank=True, on_delete=models.CASCADE)
