from django.contrib import admin
from .models import Token, Balance, Subscription, CreatoUser
# Register your models here.
admin.site.register(Token)
admin.site.register(Balance)
admin.site.register(Subscription)
admin.site.register(CreatoUser)
