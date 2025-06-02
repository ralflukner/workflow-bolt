# Use official PHP image with Apache
FROM php:8.1-apache

# Install required PHP extensions
RUN apt-get update && apt-get install -y \
    libxml2-dev \
    && docker-php-ext-install soap \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache modules for security and rewriting
RUN a2enmod rewrite ssl headers

# Security headers configuration
RUN echo "ServerTokens Prod" >> /etc/apache2/apache2.conf && \
    echo "ServerSignature Off" >> /etc/apache2/apache2.conf

# Copy security-focused Apache configuration
COPY apache-security.conf /etc/apache2/conf-available/security.conf
RUN a2enconf security

# Copy application files and entrypoint script
COPY --chown=www-data:www-data . /var/www/html/
COPY docker-entrypoint.sh /usr/local/bin/

# Set secure permissions
RUN chmod -R 755 /var/www/html && \
    chown -R www-data:www-data /var/www/html && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# Security: Remove sensitive files if they exist
RUN rm -f /var/www/html/Dockerfile /var/www/html/.env* /var/www/html/*.log

# Health check for monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/test || exit 1

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"] 