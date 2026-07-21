from django.shortcuts import render
from  django.core.files.storage import FileSystemStorage
from  django.http import JsonResponse
import os 
from django.conf import settings
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required(login_url="login")
def home(request):
    return render(request, "chat/index.html")


def upload_file(request):
    if request.method == "POST":
        file = request.FILES.get("file")

        if not file:
         return JsonResponse({
            "status":"error",
            "filename":"No file selected"
        })
        
        fs = FileSystemStorage()
        filename = fs.save(f"uploads/{file.name}", file)

        return JsonResponse({
            "status": "success",
            "filename": filename,
            "url": fs.url(filename),
            "path": os.path.join(settings.MEDIA_ROOT, filename),

            "type": file.content_type
        })

    return JsonResponse({
        "status": "error",
        "message": "Invalid request"
    })
