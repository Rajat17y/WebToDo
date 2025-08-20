from django import forms #Used to create django form fields
from django.contrib.auth.models import User #Imports the default Django User model which represents users in the authentication system.
from django.contrib.auth.forms import UserCreationForm #Imports the built-in form used to create new users, which handles password fields and validation.

class SignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username','email','password1','password2']

class LoginForm(forms.Form):
    username = forms.CharField(max_length=150, widget=forms.TextInput(attrs={'placeholder': 'Username'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Password'}))