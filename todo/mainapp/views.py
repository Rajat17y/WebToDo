from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import SignUpForm
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required


def landing_page(request):
    return render(request, 'mainapp/landing.html')

@login_required #This shit redirects to the home page but only works if your are logined
def home(request):
    return HttpResponse("Welcome to the home page!")

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