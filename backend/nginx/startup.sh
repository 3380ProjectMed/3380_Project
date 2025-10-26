#!/bin/sh
set -e

echo "=== Starting MedConnect Application ==="
# Start PHP-FPM first
echo "Starting PHP-FPM..."
php-fpm -D

# Wait a moment for PHP-FPM to start
sleep 2

# Verify PHP-FPM is running
if ! pgrep -x php-fpm > /dev/null; then
    echo "ERROR: PHP-FPM failed to start!"
    exit 1
fi
echo "✅ PHP-FPM started successfully"
# Copy NGINX configuration to system location
echo "Configuring NGINX..."
cp /home/site/wwwroot/nginx/nginx.conf /etc/nginx/sites-available/default
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Remove any default configs
rm -f /etc/nginx/sites-enabled/default.conf

# Test NGINX configuration
echo "Testing NGINX configuration..."
nginx -t

# Start or reload NGINX
echo "Starting NGINX..."
if [ -f /var/run/nginx.pid ]; then
    nginx -s reload
else
    nginx
fi

echo "=== Application started successfully ==="

# Keep container running
tail -f /dev/null