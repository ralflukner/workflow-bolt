FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libxml2-dev \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install soap

# Copy Apache configuration templates
COPY docker/000-default.conf.template /etc/apache2/sites-available/000-default.conf.template
COPY docker/ports.conf.template /etc/apache2/ports.conf.template

# Copy application files
COPY . /var/www/
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Set permissions
RUN chown -R www-data:www-data /var/www \
    && chmod +x /usr/local/bin/entrypoint.sh

# Expose port (will be overridden by Cloud Run)
EXPOSE 8080

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
