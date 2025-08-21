from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import SignUpForm
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .models import Tasks
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .forms import ToDoForm


def landing_page(request):
    return render(request, 'mainapp/landing.html')

@login_required #This shit redirects to the home page but only works if your are logined
def home(request):
    context = {'username': request.user.get_full_name() or request.user.username}
    return render(request,'mainapp/dashboard.html',context)



@login_required
def delete_task(request, pk):
    if request.method == "POST":
        task = get_object_or_404(Tasks, id=pk, user=request.user)
        task.delete()
    return redirect('todolist')  # change to your correct view name
    
@login_required
def todo_page_view(request):
    user = request.user
    todos = Tasks.objects.filter(user=user).order_by('order_field')  # OR relevant order
    
    if request.method == 'POST':
        form = ToDoForm(request.POST)
        if form.is_valid():
            todo = form.save(commit=False)
            todo.user = user
            todo.save()
            return redirect('todolist')
    else:
        form = ToDoForm()

    context = {
        'todos': todos,
        'form': form,
        'username': user.get_full_name() or user.username,
    }
    return render(request, 'mainapp/todolist.html', context)


def signup(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # log the user in after signup
            return redirect('home')  # redirect to homepage or dashboard
    else:
        form = SignUpForm()
    return render(request, 'mainapp/signup.html', {'form': form})