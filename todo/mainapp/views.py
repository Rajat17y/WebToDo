from django.shortcuts import render, redirect
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from .forms import SignUpForm
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Tasks, CalendarEvent, UserProfile
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .forms import ToDoForm
import json
from datetime import datetime, date
from django.contrib import messages
from django.contrib.auth.models import User

def landing_page(request):
    return render(request, 'mainapp/landing.html')

@login_required
def home(request):
    user = request.user
    
    # Get current hour for greeting
    current_hour = datetime.now().hour
    if 5 <= current_hour < 12:
        greeting = "Good Morning"
    elif 12 <= current_hour < 17:
        greeting = "Good Afternoon"
    elif 17 <= current_hour < 21:
        greeting = "Good Evening"
    else:
        greeting = "Good Night"

    # Get task statistics for the dashboard
    total_tasks = Tasks.objects.filter(user=user).count()
    completed_tasks = Tasks.objects.filter(user=user, completed=True).count()
    pending_tasks = Tasks.objects.filter(user=user, completed=False).count()

    # Recent tasks
    recent_tasks = Tasks.objects.filter(user=user).order_by('-created_at')[:5]

    # Tasks created today
    today_tasks = Tasks.objects.filter(user=user, completed=False, created_at__date=timezone.now().date()).count()

    context = {
        'username': user.get_full_name() or user.username,
        'greeting': greeting,
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'pending_tasks': pending_tasks,
        'recent_tasks': recent_tasks,
        'today_tasks': today_tasks,
    }
    return render(request, 'mainapp/dashboard.html', context)

# Profile Views
@login_required
def profile_view(request):
    """Display user profile"""
    user = request.user
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    context = {
        'username': user.get_full_name() or user.username,
        'user': user,
        'profile': profile,
    }
    return render(request, 'mainapp/profile.html', context)

@login_required
def update_profile(request):
    """Update user profile information"""
    if request.method == 'POST':
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Update user fields
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()
        
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        if email:
            user.email = email
        
        user.save()
        
        # Update profile fields
        bio = request.POST.get('bio', '').strip()
        phone = request.POST.get('phone', '').strip()
        date_of_birth = request.POST.get('date_of_birth')
        
        if bio:
            profile.bio = bio
        if phone:
            profile.phone = phone
        if date_of_birth:
            try:
                profile.date_of_birth = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        profile.save()
        
        messages.success(request, 'Profile updated successfully!')
        return redirect('profile')
    
    return redirect('profile')

@login_required
def upload_profile_photo(request):
    """Upload profile photo"""
    if request.method == 'POST' and request.FILES.get('profile_photo'):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        profile.profile_photo = request.FILES['profile_photo']
        profile.save()
        
        messages.success(request, 'Profile photo updated successfully!')
        return JsonResponse({'success': True, 'photo_url': profile.get_profile_photo_url()})
    
    return JsonResponse({'success': False, 'error': 'No photo uploaded'})

@login_required
def change_password(request):
    """Change user password"""
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)  # Important!
            messages.success(request, 'Your password was successfully updated!')
            return redirect('profile')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"{field}: {error}")
    
    return redirect('profile')

# Calendar Views
@login_required
def calendar_view(request):
    """Display the calendar page"""
    context = {
        'username': request.user.get_full_name() or request.user.username,
    }
    return render(request, 'mainapp/calendar.html', context)

@login_required
def get_calendar_events(request):
    """API to get calendar events as JSON for FullCalendar"""
    events = []
    calendar_events = CalendarEvent.objects.filter(user=request.user)
    
    for event in calendar_events:
        # Set color based on priority
        color = '#3273dc'  # default blue
        if event.priority == 'high':
            color = '#dc3545'  # red
        elif event.priority == 'medium':
            color = '#ffc107'  # yellow
        elif event.priority == 'low':
            color = '#28a745'  # green
        
        # Build start and end datetime
        if event.all_day:
            start = event.start_date.isoformat()
            end = (event.end_date or event.start_date).isoformat()
        else:
            start_datetime = datetime.combine(event.start_date, event.start_time or datetime.min.time())
            start = start_datetime.isoformat()
            
            if event.end_date and event.end_time:
                end_datetime = datetime.combine(event.end_date, event.end_time)
                end = end_datetime.isoformat()
            else:
                end = start
        
        events.append({
            'id': event.id,
            'title': event.title,
            'start': start,
            'end': end,
            'allDay': event.all_day,
            'color': color,
            'extendedProps': {
                'description': event.description,
                'priority': event.priority,
            }
        })
    
    return JsonResponse(events, safe=False)

@login_required
def add_calendar_event(request):
    """Add a new calendar event"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Parse the data
            title = data.get('title', '').strip()
            description = data.get('description', '').strip()
            start_date_str = data.get('start_date')
            start_time_str = data.get('start_time')
            end_date_str = data.get('end_date')
            end_time_str = data.get('end_time')
            priority = data.get('priority', 'medium')
            all_day = data.get('all_day', False)
            
            if not title or not start_date_str:
                return JsonResponse({'success': False, 'error': 'Title and start date are required'})
            
            # Parse dates
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            start_time = None
            end_date = None
            end_time = None
            
            if not all_day and start_time_str:
                start_time = datetime.strptime(start_time_str, '%H:%M').time()
            
            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                
            if not all_day and end_time_str:
                end_time = datetime.strptime(end_time_str, '%H:%M').time()
            
            # Create the event
            CalendarEvent.objects.create(
                user=request.user,
                title=title,
                description=description,
                start_date=start_date,
                start_time=start_time,
                end_date=end_date,
                end_time=end_time,
                priority=priority,
                all_day=all_day
            )
            
            return JsonResponse({'success': True, 'message': 'Event added successfully'})
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def update_calendar_event(request, event_id):
    """Update a calendar event"""
    if request.method == 'POST':
        try:
            event = get_object_or_404(CalendarEvent, id=event_id, user=request.user)
            data = json.loads(request.body)
            
            # Update fields
            event.title = data.get('title', event.title)
            event.description = data.get('description', event.description)
            event.priority = data.get('priority', event.priority)
            event.all_day = data.get('all_day', event.all_day)
            
            # Update dates
            if data.get('start_date'):
                event.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            
            if data.get('start_time') and not event.all_day:
                event.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            
            if data.get('end_date'):
                event.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
                
            if data.get('end_time') and not event.all_day:
                event.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            
            event.save()
            
            return JsonResponse({'success': True, 'message': 'Event updated successfully'})
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def delete_calendar_event(request, event_id):
    """Delete a calendar event"""
    if request.method == 'DELETE':
        try:
            event = get_object_or_404(CalendarEvent, id=event_id, user=request.user)
            event.delete()
            return JsonResponse({'success': True, 'message': 'Event deleted successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

# Existing Task Views remain the same...
@login_required
def delete_task(request, pk):
    if request.method == "POST":
        task = get_object_or_404(Tasks, id=pk, user=request.user)
        task.delete()
        reorder_tasks(request.user)
        return redirect('todolist')

@login_required
def mark_task_done(request, pk):
    """Mark task as completed"""
    if request.method == "POST":
        task = get_object_or_404(Tasks, id=pk, user=request.user)
        task.completed = True
        task.completed_at = timezone.now()
        task.save()
        reorder_pending_tasks(request.user)
        return redirect('todolist')

@login_required
def undo_task(request, pk):
    """Mark completed task as pending again"""
    if request.method == "POST":
        task = get_object_or_404(Tasks, id=pk, user=request.user, completed=True)
        task.completed = False
        task.completed_at = None

        # Give it a new order at the end of pending tasks
        max_order = Tasks.objects.filter(user=request.user, completed=False).aggregate(
            models.Max('order_field'))['order_field__max']
        task.order_field = (max_order or 0) + 1
        task.save()

        return redirect('todolist')

@login_required
def todo_page_view(request):
    user = request.user

    # Get pending and completed tasks separately
    pending_todos = Tasks.objects.filter(user=user, completed=False).order_by('order_field')
    completed_todos = Tasks.objects.filter(user=user, completed=True).order_by('-completed_at')

    if request.method == 'POST':
        task_text = request.POST.get('task', '').strip()
        if task_text:
            Tasks.objects.create(user=user, task=task_text)
        return redirect('todolist')

    context = {
        'pending_todos': pending_todos,
        'completed_todos': completed_todos,
        'username': user.get_full_name() or user.username,
    }
    return render(request, 'mainapp/todolist.html', context)

@login_required
def update_task_order(request):
    """Handle AJAX request to update task order"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            task_orders = data.get('task_orders', [])

            for item in task_orders:
                task_id = item['id']
                new_order = item['order']
                task = Tasks.objects.get(id=task_id, user=request.user, completed=False)
                task.order_field = new_order
                task.save()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request'})

def reorder_tasks(user):
    """Reorder tasks sequentially after deletion"""
    tasks = Tasks.objects.filter(user=user, completed=False).order_by('order_field')
    for index, task in enumerate(tasks, start=1):
        task.order_field = index
        task.save()

def reorder_pending_tasks(user):
    """Reorder only pending tasks sequentially"""
    tasks = Tasks.objects.filter(user=user, completed=False).order_by('order_field')
    for index, task in enumerate(tasks, start=1):
        task.order_field = index
        task.save()

def signup(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('home')
    else:
        form = SignUpForm()
    return render(request, 'mainapp/signup.html', {'form': form})
