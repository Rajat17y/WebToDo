from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.landing_page, name='landing'),
    path('userin/', views.home, name='home'),
    path('signup/', views.signup, name='signup'),
    path('login/', auth_views.LoginView.as_view(template_name='mainapp/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    path('todo/', views.todo_page_view, name='todolist'),
    path('todo/delete/<int:pk>/', views.delete_task, name='delete_task'),
    path('todo/done/<int:pk>/', views.mark_task_done, name='mark_task_done'),  # Add this
    path('todo/undo/<int:pk>/', views.undo_task, name='undo_task'),  # Add this
    path('todo/update-order/', views.update_task_order, name='update_task_order'),
]
