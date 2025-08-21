from django.db import models
from django.contrib.auth.models import User

class Tasks(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE,null=True, blank=True, related_name='todos')
    task = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    order_field = models.PositiveIntegerField(default=0, null=True, blank=True) # Add this field

    def __str__(self):
        return self.task