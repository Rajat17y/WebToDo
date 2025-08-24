from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.landing_page, name='landing'),
    path('userin/', views.home, name='home'),
    path('signup/', views.signup, name='signup'),
    path('login/', auth_views.LoginView.as_view(template_name='mainapp/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    path('todo/', views.todo_page_view, name='todolist'),
    path('todo/delete/<int:pk>/', views.delete_task, name='delete_task'),
    path('todo/done/<int:pk>/', views.mark_task_done, name='mark_task_done'),
    path('todo/undo/<int:pk>/', views.undo_task, name='undo_task'),
    path('todo/update-order/', views.update_task_order, name='update_task_order'),
    
    # Calendar URLs
    path('calendar/', views.calendar_view, name='calendar'),
    path('calendar/events/', views.get_calendar_events, name='get_calendar_events'),
    path('calendar/add-event/', views.add_calendar_event, name='add_calendar_event'),
    path('calendar/update-event/<int:event_id>/', views.update_calendar_event, name='update_calendar_event'),
    path('calendar/delete-event/<int:event_id>/', views.delete_calendar_event, name='delete_calendar_event'),
    
    # Profile URLs
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/upload-photo/', views.upload_profile_photo, name='upload_profile_photo'),
    path('profile/change-password/', views.change_password, name='change_password'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
