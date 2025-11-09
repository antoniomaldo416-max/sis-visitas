"""
Django settings for core project.
Configurado para Render y PostgreSQL
"""

from pathlib import Path
import os
import dj_database_url

# ======================================
# RUTAS BASE
# ======================================
BASE_DIR = Path(__file__).resolve().parent.parent

# ======================================
# SEGURIDAD
# ======================================
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-))a#k-v&qml(&al+^30n=v=pabk6%w1y(vxgz^5i)hsm*w5q-9')
DEBUG = False  # ⚠️ En producción siempre False
ALLOWED_HOSTS = ['*']

# ======================================
# APLICACIONES INSTALADAS
# ======================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Tus apps
    'rest_framework',
    'corsheaders',
    'users',
    'catalog',
    'visits',
    'auditlog',
    'reports',
]

# ======================================
# MIDDLEWARE
# ======================================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

# ======================================
# TEMPLATES
# ======================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# ======================================
# BASE DE DATOS (PostgreSQL Render)
# ======================================
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600,
        ssl_require=True
    )
}

# ======================================
# VALIDACIÓN DE CONTRASEÑAS
# ======================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ======================================
# CONFIGURACIÓN REGIONAL
# ======================================
LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/Guatemala'
USE_I18N = True
USE_TZ = True

# ======================================
# ARCHIVOS ESTÁTICOS Y MEDIA
# ======================================
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ======================================
# CORS (para el frontend)
# ======================================
CORS_ALLOW_ALL_ORIGINS = True

# ======================================
# ZONA HORARIA DEL SISTEMA
# ======================================
os.environ['TZ'] = 'America/Guatemala'
