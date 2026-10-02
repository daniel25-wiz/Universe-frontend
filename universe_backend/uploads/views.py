import os
import uuid

from django.conf import settings
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import ApiError

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


class UploadImageView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file_obj = request.FILES.get("image") or request.FILES.get("file")
        if file_obj is None:
            raise ApiError("No image file was provided.", code="VALIDATION_ERROR", status_code=400)

        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ApiError("Only JPG, PNG, WEBP or GIF images are allowed.", code="INVALID_FILE_TYPE", status_code=400)
        if file_obj.size > settings.MAX_UPLOAD_BYTES:
            raise ApiError("Image must be smaller than 5MB.", code="FILE_TOO_LARGE", status_code=400)

        subdir = "uploads"
        os.makedirs(os.path.join(settings.MEDIA_ROOT, subdir), exist_ok=True)
        filename = f"{uuid.uuid4().hex}{ext}"
        rel_path = os.path.join(subdir, filename)
        abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)
        with open(abs_path, "wb") as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)

        url = f"{settings.PUBLIC_BASE_URL}{settings.MEDIA_URL}{rel_path}".replace(os.sep, "/")
        return Response({"url": url, "name": file_obj.name, "size": file_obj.size}, status=201)
