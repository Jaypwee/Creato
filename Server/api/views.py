from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Create your views here.

@api_view(['GET'])
def get(request):
    """
    :param request: nothing
    :return: test response
    """
    return Response({'message': 'hello'})
