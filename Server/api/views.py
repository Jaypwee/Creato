from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse, Http404
from django.contrib.auth import authenticate, login
from .models import Token, Subscription, Balance, CreatoUser
from .serializers import TokenSerializers, SubscriptionSerializers, BalanceSerializers, CreatoUserSerializers, UserSerializers
from django.forms.models import model_to_dict

import uuid

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
    user = User.objects.create_user(email=request.data['email'], password=request.data['password'], username=request.data['username'])
    user.save()
    return Response({'message': 'received'})

@api_view(['POST'])
def signIn(request):
    """
    :param request: user email and password
    :return: success
    """
    user = authenticate(request, username=request.data['username'], password=request.data['password'])
    serializer = UserSerializers(user)
    print(serializer.data)
    if user is not None:
        login(request, user)
        return JsonResponse(serializer.data, safe=False)
    else:
        return JsonResponse({'message': 'Credentials are incorrect'})

# Token URLS

@api_view(['GET'])
def tokens(request):
    """

    :param request:
    :return:
    """
    tokens = Token.objects.values()
    serializedTokens = TokenSerializers(tokens, many=True)

    return JsonResponse(serializedTokens.data, safe=False, status=201)

@api_view(['POST'])
def subscribe(request):
    """

    :param request:
    :return:
    """
    token = Token.objects.get(uuid=request.data.pop('tokenUuid'))
    user = User.objects.get(username=request.data.pop('username'))
    # valid_user = UserSerializers(instance=user)
    # valid_token = TokenSerializers(instance=token)
    # id = '12345'
    # request.data['token'] = valid_token.data
    # request.data['uuid'] = id
    # request.data['user'] = valid_user.data
    # print(valid_user.data)
    # subscription = SubscriptionSerializers(data=request.data)
    # print(subscription)
    # if subscription.is_valid():
    #     subscription.save()
    #     return JsonResponse(subscription.data, status=201, safe=False)
    # else:
    #     print(subscription.errors)
    #     return JsonResponse({'wrong': 'wrong'}, status=400)

    totalPrice = request.data['amount'] * token.price
    if (totalPrice > user.creatouser.usdBalance):
        return JsonResponse({'error': 'Not enough balance'}, status=400)
    print(request.data)
    if (Subscription.objects.filter(token=token, user=user, status=Subscription.SUBSCRIBED).exists()):
        subscription = Subscription.objects.get(token=token, user=user)
        subscription.amount += request.data['amount']
    else:
        subscription = Subscription.objects.create(token=token, user=user, uuid=str(uuid.uuid4()), amount=request.data['amount'])
    token.subscribedAmount += request.data['amount']
    user.creatouser.usdBalance -= totalPrice
    print(user.creatouser.usdBalance)
    subscription.save()
    token.save()
    user.creatouser.save()
    serializer = SubscriptionSerializers(subscription)
    # print(subscription)
    return JsonResponse(serializer.data, status=201, safe=False)


@api_view(['DELETE'])
def unsubscribe(request, uuid):
    subscription = Subscription.objects.get(uuid=uuid)
    print(uuid)
    user = subscription.user
    token = subscription.token
    token.subscribedAmount -= subscription.amount
    print(model_to_dict(user.creatouser))
    user.creatouser.usdBalance += subscription.amount * subscription.token.price
    subscription.delete()
    token.save()
    user.creatouser.save()
    return Response(status=204)

@api_view(['POST'])
def getSubscriptions(request):
    user = User.objects.get(username=request.data['username'])
    print(user.subscription_set.all())
    subscriptions = SubscriptionSerializers(user.subscription_set.filter(status=Subscription.SUBSCRIBED).all(), many=True)
    print(subscriptions)
    return JsonResponse(subscriptions.data, safe=False, status=201)

@api_view(['POST'])
def getIssuedTokens(request):
    user = User.objects.get(username=request.data['username'])
    subscriptions = SubscriptionSerializers(user.subscription_set.filter(status=Subscription.ISSUED).all(), many=True)
    return JsonResponse(subscriptions.data, safe=False, stauts=201)

@api_view(['POST'])
def addBalance(request):
    user = User.objects.get(username=request.data['username'])
    user.creatouser.usdBalance += request.data['amount']
    user.creatouser.save()
    serialized = CreatoUserSerializers(user.creatouser)
    return JsonResponse(serialized.data, status=201, safe=False)

@api_view(['POST'])
def getBalance(request):
    user = User.objects.get(username=request.data['username'])
    serializer = CreatoUserSerializers(user.creatouser)

    return JsonResponse(serializer.data, safe=False, status=201)

@api_view(['POST'])
def issueToken(request):
    token = Token.objects.get(uuid=request.data['uuid'])
    token.isIssued = True
    token.save()

    return JsonResponse(status=204)

@api_view(['POST'])
def listToken(request):
    token = Token.objects.get(uuid=request.data['uuid'])
    token.isListed = True
    token.save()

    return JsonResponse(status=204)

