# Use official PHP image with Apache
FROM php:8.1-apache

# Security: Run as non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

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

# Copy application files
COPY --chown=appuser:appgroup . /var/www/html/

# Set secure permissions
RUN chmod -R 755 /var/www/html && \
    chown -R appuser:appgroup /var/www/html

# Security: Remove sensitive files if they exist
RUN rm -f /var/www/html/Dockerfile /var/www/html/.env* /var/www/html/*.log

# Switch to non-root user for runtime
USER appuser

# Health check for monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/test || exit 1

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"] 