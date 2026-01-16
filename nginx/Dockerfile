FROM nginx:alpine

# Copy nginx config into conf.d
COPY nginx.dev.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
