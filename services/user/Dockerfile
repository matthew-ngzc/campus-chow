# ===== Base (install deps) =====
FROM node:20 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# ===== Runtime =====
FROM node:20
WORKDIR /app
ENV NODE_ENV=production
# Ports: using 8087 per your map
EXPOSE 8087
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# healthcheck (optional)
HEALTHCHECK --interval=10s --timeout=3s --retries=10 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","src/index.js"]
