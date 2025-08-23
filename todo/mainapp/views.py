from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import SignUpForm
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Tasks
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .forms import ToDoForm
import json

def landing_page(request):
    return render(request, 'mainapp/landing.html')

@login_required
def home(request):
    user = request.user
    
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
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'pending_tasks': pending_tasks,
        'recent_tasks': recent_tasks,
        'today_tasks': today_tasks,
    }
    return render(request, 'mainapp/dashboard.html', context)

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
