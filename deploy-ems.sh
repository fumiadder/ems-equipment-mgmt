#!/bin/bash
# ============================================================
#  EMS 智能设备管理系统 - 一键部署脚本
#  适用于: Ubuntu / CentOS / Debian
#  用法:   bash deploy.sh
# ============================================================

set -e

# ---------- 配置 ----------
PROJECT_DIR="/root/fuminer/trae_projects/ems-equipment-mgmt"
BACKEND_PORT=3001
GIT_REPO="https://github.com/fumiadder/ems-equipment-mgmt.git"
BRANCH="main"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============================================================
# Step 1: 检查并安装 Node.js
# ============================================================
echo ""
echo "=========================================="
echo "  Step 1: 检查 Node.js 环境"
echo "=========================================="

if command -v node &> /dev/null; then
    NODE_VER=$(node -v)
    ok "Node.js 已安装: $NODE_VER"
else
    warn "Node.js 未安装，正在安装..."
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    else
        err "不支持的系统，请手动安装 Node.js 20+"
    fi
    ok "Node.js 安装完成: $(node -v)"
fi

if command -v npm &> /dev/null; then
    ok "npm 已安装: $(npm -v)"
else
    err "npm 未找到"
fi

# ============================================================
# Step 2: 安装 PM2 (进程管理器)
# ============================================================
echo ""
echo "=========================================="
echo "  Step 2: 安装 PM2"
echo "=========================================="

if command -v pm2 &> /dev/null; then
    ok "PM2 已安装: $(pm2 -v)"
else
    npm install -g pm2
    ok "PM2 安装完成"
fi

# ============================================================
# Step 3: 克隆/更新项目代码
# ============================================================
echo ""
echo "=========================================="
echo "  Step 3: 获取项目代码"
echo "=========================================="

if [ -d "$PROJECT_DIR" ]; then
    info "项目目录已存在，更新代码..."
    cd "$PROJECT_DIR"
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"
    ok "代码已更新到最新版本"
else
    info "克隆项目到 $PROJECT_DIR ..."
    mkdir -p "$(dirname "$PROJECT_DIR")"
    git clone -b "$BRANCH" "$GIT_REPO" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    ok "项目克隆完成"
fi

# ============================================================
# Step 4: 安装后端依赖 & 启动
# ============================================================
echo ""
echo "=========================================="
echo "  Step 4: 部署后端服务"
echo "=========================================="

cd "$PROJECT_DIR/server"

info "安装后端依赖..."
npm install --production 2>&1 | tail -3
ok "后端依赖安装完成"

# 停止旧的 PM2 进程
pm2 delete ems-backend 2>/dev/null || true

# 启动后端
info "启动后端服务 (端口: $BACKEND_PORT)..."
pm2 start src/app.js \
    --name ems-backend \
    --cwd "$PROJECT_DIR/server" \
    --node-args="--max-old-space-size=512" \
    --env NODE_ENV=production \
    --env PORT=$BACKEND_PORT

pm2 save
ok "后端服务已启动"

# 等待后端就绪
info "等待后端服务就绪..."
for i in $(seq 1 15); do
    if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
        ok "后端服务就绪 (http://localhost:$BACKEND_PORT)"
        break
    fi
    if [ $i -eq 15 ]; then
        warn "后端服务启动超时，请检查日志: pm2 logs ems-backend"
    fi
    sleep 1
done

# ============================================================
# Step 5: 构建前端
# ============================================================
echo ""
echo "=========================================="
echo "  Step 5: 构建前端"
echo "=========================================="

cd "$PROJECT_DIR/client"

info "安装前端依赖..."
npm install 2>&1 | tail -3
ok "前端依赖安装完成"

info "构建前端 (连接后端 API)..."
VITE_API_BASE_URL="/api/v1" npm run build 2>&1 | tail -5
ok "前端构建完成 (dist/ 目录)"

# ============================================================
# Step 6: 配置 Nginx
# ============================================================
echo ""
echo "=========================================="
echo "  Step 6: 配置 Nginx"
echo "=========================================="

if ! command -v nginx &> /dev/null; then
    warn "Nginx 未安装，正在安装..."
    if command -v apt-get &> /dev/null; then
        apt-get install -y nginx
    elif command -v yum &> /dev/null; then
        yum install -y nginx
    fi
    ok "Nginx 安装完成"
fi

# 生成 Nginx 配置
NGINX_CONF="/etc/nginx/sites-available/ems.conf"
NGINX_LINK="/etc/nginx/sites-enabled/ems.conf"

# 检测 Nginx 配置目录风格
if [ -d "/etc/nginx/conf.d" ] && [ ! -d "/etc/nginx/sites-available" ]; then
    NGINX_CONF="/etc/nginx/conf.d/ems.conf"
    NGINX_LINK=""
fi

cat > "$NGINX_CONF" << 'NGINX_EOF'
server {
    listen 80 default_server;
    server_name _;

    # 前端静态文件
    root /root/fuminer/trae_projects/ems-equipment-mgmt/client/dist;
    index index.html;

    # SPA 路由 - 所有未匹配的请求返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # 静态资源缓存
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1024;
}
NGINX_EOF

# 创建符号链接 (Debian/Ubuntu 风格)
if [ -n "$NGINX_LINK" ] && [ ! -f "$NGINX_LINK" ]; then
    mkdir -p /etc/nginx/sites-enabled
    ln -sf "$NGINX_CONF" "$NGINX_LINK"
fi

# 删除默认配置 (避免冲突)
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

# 确保 nginx.conf 包含 conf.d/*.conf (RHEL/CentOS 系统)
if [ -d "/etc/nginx/conf.d" ] && ! grep -q "conf.d/\*\.conf" /etc/nginx/nginx.conf 2>/dev/null; then
    sed -i "/include.*mime.types/a\\    include /etc/nginx/conf.d/*.conf;" /etc/nginx/nginx.conf 2>/dev/null || true
fi

# 确保 /root 目录对 nginx worker 可读 (前端文件在 /root 下)
chmod 755 /root 2>/dev/null || true

# 测试 Nginx 配置
nginx -t 2>&1 && ok "Nginx 配置正确" || err "Nginx 配置有误，请检查"

# 重载 Nginx
systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
ok "Nginx 已重载"

# ============================================================
# Step 7: 配置防火墙 (放行 80 端口)
# ============================================================
echo ""
echo "=========================================="
echo "  Step 7: 检查防火墙"
echo "=========================================="

if command -v ufw &> /dev/null; then
    ufw allow 80/tcp 2>/dev/null && ok "UFW: 已放行 80 端口" || warn "UFW 配置跳过"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp 2>/dev/null && firewall-cmd --reload 2>/dev/null && ok "Firewalld: 已放行 80 端口" || warn "Firewalld 配置跳过"
else
    warn "未检测到防火墙工具，请确保华为云安全组已放行 80 端口"
fi

# ============================================================
# 完成
# ============================================================
echo ""
echo "=========================================="
echo -e "${GREEN}  🎉 EMS 智能设备管理系统部署完成！${NC}"
echo "=========================================="
echo ""
echo "  📡 访问地址: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "  🔧 后端端口: $BACKEND_PORT"
echo "  📋 PM2 管理: pm2 list | pm2 logs ems-backend"
echo "  🔄 重启后端: pm2 restart ems-backend"
echo ""
echo "  ⚠️  如果无法访问，请检查:"
echo "     1. 华为云安全组是否放行了 80 端口 (入方向)"
echo "     2. 服务器防火墙是否放行了 80 端口"
echo ""
