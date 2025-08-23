from django.db import models
from django.contrib.auth.models import User

class Tasks(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    task = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    order_field = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)  # Add this field
    completed_at = models.DateTimeField(null=True, blank=True)  # Add this field

    class Meta:
        ordering = ['completed', 'order_field']  # Show pending first

    def __str__(self):
        return self.task

    def save(self, *args, **kwargs):
        if not self.pk:  # New task
            max_order = Tasks.objects.filter(user=self.user, completed=False).aggregate(
                models.Max('order_field'))['order_field__max']
            self.order_field = (max_order or 0) + 1
        super().save(*args, **kwargs)
