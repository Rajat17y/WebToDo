from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver  # Add this import

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

# New Model for Calendar Events
class CalendarEvent(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    all_day = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date', 'start_time']

    def __str__(self):
        return f"{self.title} - {self.start_date}"

# New Model for User Profile
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def get_profile_photo_url(self):
        if self.profile_photo:
            return self.profile_photo.url
        return "https://via.placeholder.com/150x150/3273dc/fff?text=" + self.user.username[:2].upper()

# Signal to create profile when user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        UserProfile.objects.create(user=instance)