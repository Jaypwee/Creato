from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from .models import User
from django.http import HttpResponse, Http404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
import json

# Create your views here.

@api_view(['GET'])
def get(request):
    """
    :param request: nothing
    :return: test response
    """
    return Response({'message': 'hello'})

@api_view(['POST'])
def signUp(request):
    """
    :param requerst: user information
    :return: success message
    """
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    user = User.objects.create_user(email=body['email'], password=body['password'], username=body['username'])
    # user = User.objects.create(email=body.email, password=body.password, name=body.name)
    user.save()
    print(body)
    return Response({'message': 'received'})

@api_view(['POST'])
def signIn(request):
    """
    :param request: user email and password
    :return: success
    """
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    user = authenticate(request, username=body['username'], password=body['password'])
    if user is not None:
        login(request, user);
        return Response({'test': 'test'})
    else:
        return Http404('Credentials are incorrect')

