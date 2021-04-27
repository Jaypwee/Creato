from django.db import models

# Create your models here.

from django.db import models

class User(models.Model):
    email = models.EmailField()
    password = models.CharField(max_length=128)
    name = models.CharField(max_length=60)

    def __str__(self):
        return self.name


class Token(models.Model):
    name = models.CharField(max_length=60)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name