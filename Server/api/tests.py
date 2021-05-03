from django.test import TestCase, Client
import json

c = Client()

# Create your tests here.

class SetupTestCase(TestCase):
    def test_response(self):
        """Testing whether api endpoint is properly working"""
        response = c.get('/hello')
        body = response.content.decode('utf-8')
        val = json.loads(body)
        self.assertEqual(val['message'], 'hello')

