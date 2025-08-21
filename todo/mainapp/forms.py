from django import forms #Used to create django form fields
from django.contrib.auth.models import User #Imports the default Django User model which represents users in the authentication system.
from django.contrib.auth.forms import UserCreationForm #Imports the built-in form used to create new users, which handles password fields and validation.
from .models import Tasks

class SignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username','email','password1','password2']

class ToDoForm(forms.ModelForm):
    class Meta:
        model = Tasks
        fields = ['task']
        widgets = {
            'task': forms.TextInput(attrs={
                'class': 'input',
                'placeholder': 'Enter new task...'
            }),
        }

username = forms.CharField(widget=forms.TextInput(attrs={'class': 'input', 'placeholder': 'Username'}))
email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'input', 'placeholder': 'Email'}))
password1 = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'input', 'placeholder': 'Password'}))
password2 = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'input', 'placeholder': 'Confirm Password'}))
