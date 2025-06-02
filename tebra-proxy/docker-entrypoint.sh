#!/bin/bash
set -e

# Set default port if not provided
PORT=${PORT:-8080}

# Configure Apache to listen on the Cloud Run PORT
echo "Listen $PORT" > /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:$PORT>/" /etc/apache2/sites-available/000-default.conf

# Start Apache
exec apache2-foreground 