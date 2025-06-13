#!/bin/bash
set -e

# Substitute environment variables in Apache config files
envsubst '${PORT}' < /etc/apache2/sites-available/000-default.conf.template > /etc/apache2/sites-available/000-default.conf
envsubst '${PORT}' < /etc/apache2/ports.conf.template > /etc/apache2/ports.conf

# Start Apache in foreground
apache2-foreground 