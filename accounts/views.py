from django.shortcuts import render,redirect
from django.contrib.auth import authenticate
from django.contrib.auth import login
from django.contrib.auth import logout
from django.contrib.auth.models import User
from .forms import RegisterForm

# Create your views here.
def register_view(request):

    if request.method == "POST":

        username = request.POST["username"]

        email = request.POST["email"]

        password = request.POST["password"]

        confirm = request.POST["confirm_password"]

        if password != confirm:

            return render(
                request,
                "accounts/register.html",
                {
                    "error": "Passwords do not match"
                }
            )

        if User.objects.filter(username=username).exists():

            return render(
                request,
                "accounts/register.html",
                {
                    "error": "Username already exists"
                }
            )

        User.objects.create_user(

            username=username,

            email=email,

            password=password

        )

        return redirect("login")

    return render(
        request,
        "accounts/register.html"
    )

def login_view(request):

    if request.method == "POST":

        username = request.POST["username"]

        password = request.POST["password"]

        user = authenticate(

            request,

            username=username,

            password=password

        )

        if user:

            login(request, user)

            return redirect("/")

        return render(
            request,
            "accounts/login.html",
            {
                "error": "Invalid credentials"
            }
        )

    return render(
        request,
        "accounts/login.html"
    )

def logout_view(request):

    logout(request)

    return redirect("login")