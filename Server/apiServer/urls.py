"""apiServer URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from api import views

urlpatterns = [
    path('admin/doc/', include('django.contrib.admindocs.urls')),
    path('admin/', admin.site.urls),
    path('hello', views.get),
    path('signUp',views.signUp),
    path('signIn', views.signIn),
    path('tokens', views.tokens),
    path('balance', views.getBalance),
    path('addBalance', views.addBalance),
    path('subscribe', views.subscribe),
    path('unsubscribe', views.unsubscribe),
    path('subscriptions', views.getSubscriptions),
    path('token/issue', views.issueToken),
    path('token/list', views.listToken),
    path('deposit', views.addBalance),
    path('unsubscribe/<str:uuid>', views.unsubscribe)
]
