#!/bin/bash
# ============================================================
#  EMS 智能设备管理系统 - 一键更新部署脚本
#  用法:   bash update-ems.sh
#  功能:   拉取最新代码 → 构建 → 重启服务 → 健康检查
# ============================================================

set -e

# ---------- 配置 ----------
PROJECT_DIR="/root/fuminer/trae_projects/ems-equipment-mgmt"
BACKEND_PORT=3001
GIT_REPO="https://github.com/fumiadder/ems-equipment-mgmt.git"
BRANCH="main"
HEALTH_TIMEOUT=30

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step()  { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# 记录开始时间
START_TIME=$(date +%s)

# ---------- 工具函数 ----------

check_command() {
    if ! command -v "$1" &> /dev/null; then
        err "$1 未安装，请先安装"
    fi
}

wait_for_backend() {
    local port=$1
    local timeout=$2
    info "等待后端服务就绪 (最多 ${timeout}s)..."
    for i in $(seq 1 "$timeout"); do
        if curl -s "http://localhost:${port}/api/health" > /dev/null 2>&1; then
            return 0
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    return 1
}

run_test() {
    local name=$1
    local cmd=$2
    local expect=$3
    info "测试: $name"
    result=$(eval "$cmd" 2>&1) || true
    if echo "$result" | grep -q "$expect"; then
        ok "$name — 通过"
        return 0
    else
        warn "$name — 未通过 (期望: $expect, 实际: $result)"
        return 1
    fi
}

# ============================================================
# Step 0: 环境预检
# ============================================================
step "Step 0/7: 环境预检"

check_command git
check_command node
check_command npm
check_command pm2

ok "Node.js: $(node -v)"
ok "npm: $(npm -v)"
ok "PM2: $(pm2 -v)"

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    warn "项目目录不存在，执行首次克隆..."
    mkdir -p "$(dirname "$PROJECT_DIR")"
    git clone -b "$BRANCH" "$GIT_REPO" "$PROJECT_DIR"
    ok "项目克隆完成"
else
    ok "项目目录: $PROJECT_DIR"
fi

# ============================================================
# Step 1: 拉取最新代码
# ============================================================
step "Step 1/7: 拉取最新代码"

cd "$PROJECT_DIR"

# 保存当前版本信息
OLD_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
info "当前版本: $OLD_COMMIT"

# 拉取最新代码
git fetch origin "$BRANCH"

# 检查是否有更新
NEW_COMMIT=$(git rev-parse --short "origin/$BRANCH" 2>/dev/null || echo "unknown")
if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
    ok "代码已是最新版本 ($NEW_COMMIT)，继续重新构建..."
else
    info "发现新版本: $NEW_COMMIT (当前: $OLD_COMMIT)"
    git reset --hard "origin/$BRANCH"
    ok "代码已更新到 $NEW_COMMIT"
fi

# ============================================================
# Step 2: 备份当前运行状态
# ============================================================
step "Step 2/7: 备份当前状态"

# 备份 PM2 进程列表
pm2 save > /dev/null 2>&1 || true

# 记录当前后端状态
if pm2 describe ems-backend > /dev/null 2>&1; then
    BACKUP_STATUS="running"
    info "后端服务当前状态: 运行中"
else
    BACKUP_STATUS="stopped"
    warn "后端服务当前状态: 未运行"
fi

# ============================================================
# Step 3: 部署后端
# ============================================================
step "Step 3/7: 部署后端服务"

cd "$PROJECT_DIR/server"

# 清理旧依赖（可选，解决依赖冲突）
if [ -d "node_modules" ]; then
    info "清理旧依赖..."
    rm -rf node_modules package-lock.json
fi

info "安装后端依赖..."
npm install --production 2>&1 | tail -5
ok "后端依赖安装完成"

# 停止旧进程
info "停止旧后端进程..."
pm2 delete ems-backend 2>/dev/null || true
sleep 1

# 启动新后端
info "启动后端服务 (端口: $BACKEND_PORT)..."
pm2 start src/app.js \
    --name ems-backend \
    --cwd "$PROJECT_DIR/server" \
    --node-args="--max-old-space-size=512" \
    --env NODE_ENV=production \
    --env PORT=$BACKEND_PORT

pm2 save > /dev/null 2>&1
ok "后端进程已启动"

# 等待后端就绪
if wait_for_backend "$BACKEND_PORT" "$HEALTH_TIMEOUT"; then
    ok "后端服务已就绪 (http://localhost:$BACKEND_PORT)"
else
    err "后端服务启动超时，请检查日志: pm2 logs ems-backend"
fi

# ============================================================
# Step 4: 构建前端
# ============================================================
step "Step 4/7: 构建前端"

cd "$PROJECT_DIR/client"

# 清理旧构建
if [ -d "dist" ]; then
    info "清理旧构建..."
    rm -rf dist
fi

info "安装前端依赖..."
npm install 2>&1 | tail -5
ok "前端依赖安装完成"

info "构建前端..."
VITE_API_BASE_URL="/api/v1" npm run build 2>&1 | tail -10

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    err "前端构建失败，dist/index.html 不存在"
fi

ok "前端构建完成 (dist/)"

# ============================================================
# Step 5: 配置 Nginx
# ============================================================
step "Step 5/7: 配置 Nginx"

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

if [ -d "/etc/nginx/conf.d" ] && [ ! -d "/etc/nginx/sites-available" ]; then
    NGINX_CONF="/etc/nginx/conf.d/ems.conf"
    NGINX_LINK=""
fi

cat > "$NGINX_CONF" << 'NGINX_EOF'
server {
    listen 80 default_server;
    server_name _;

    root /root/fuminer/trae_projects/ems-equipment-mgmt/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

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

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1024;
}
NGINX_EOF

# 创建符号链接
if [ -n "$NGINX_LINK" ] && [ ! -f "$NGINX_LINK" ]; then
    mkdir -p /etc/nginx/sites-enabled
    ln -sf "$NGINX_CONF" "$NGINX_LINK"
fi

# 删除默认配置
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

# 确保 nginx.conf 包含 conf.d
if [ -d "/etc/nginx/conf.d" ] && ! grep -q "conf.d/\*\.conf" /etc/nginx/nginx.conf 2>/dev/null; then
    sed -i "/include.*mime.types/a\\    include /etc/nginx/conf.d/*.conf;" /etc/nginx/nginx.conf 2>/dev/null || true
fi

# 确保 /root 目录可读
chmod 755 /root 2>/dev/null || true

# 测试并重载
nginx -t 2>&1 && ok "Nginx 配置正确" || err "Nginx 配置有误"

systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
ok "Nginx 已重载"

# ============================================================
# Step 6: 健康检查
# ============================================================
step "Step 6/7: 健康检查"

PASS=0
FAIL=0

# 检查 1: 后端健康
if run_test "后端健康检查" \
    "curl -s http://localhost:$BACKEND_PORT/api/health" \
    "ok"; then
    ((PASS++))
else
    ((FAIL++))
fi

# 检查 2: Nginx 80 端口
if run_test "Nginx 80端口" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:80" \
    "200"; then
    ((PASS++))
else
    ((FAIL++))
fi

# 检查 3: 前端页面
if run_test "前端页面" \
    "curl -s http://localhost:80 | head -1" \
    "html"; then
    ((PASS++))
else
    ((FAIL++))
fi

# 检查 4: API 认证接口
if run_test "API认证接口" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:$BACKEND_PORT/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin123\"}'" \
    "200"; then
    ((PASS++))
else
    ((FAIL++))
fi

# 检查 5: 端口监听
if ss -tlnp | grep -q ":$BACKEND_PORT"; then
    ok "后端端口监听 — 通过"
    ((PASS++))
else
    warn "后端端口监听 — 未通过"
    ((FAIL++))
fi

if ss -tlnp | grep -q ":80"; then
    ok "Nginx 80端口监听 — 通过"
    ((PASS++))
else
    warn "Nginx 80端口监听 — 未通过"
    ((FAIL++))
fi

# ============================================================
# Step 7: 完成总结
# ============================================================
step "Step 7/7: 部署完成"

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}  🎉 EMS 智能设备管理系统更新部署完成！${NC}"
echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │  部署信息                               │"
echo "  ├─────────────────────────────────────────┤"
echo "  │  版本: $NEW_COMMIT                          │"
echo "  │  耗时: ${ELAPSED}秒                              │"
echo "  │  检查: ${PASS}项通过 / ${FAIL}项失败                  │"
echo "  ├─────────────────────────────────────────┤"
echo "  │  访问地址                               │"
echo "  ├─────────────────────────────────────────┤"
echo "  │  🌐 外网: http://$SERVER_IP        │"
echo "  │  🔧 后端: http://localhost:$BACKEND_PORT          │"
echo "  └─────────────────────────────────────────┘"
echo ""
echo "  常用命令:"
echo "    pm2 list              # 查看进程状态"
echo "    pm2 logs ems-backend  # 查看后端日志"
echo "    pm2 restart ems-backend # 重启后端"
echo "    tail -f /var/log/nginx/error.log # Nginx错误日志"
echo ""

if [ "$FAIL" -gt 0 ]; then
    warn "有 $FAIL 项检查未通过，请查看上方日志"
    exit 1
else
    ok "所有检查通过，系统运行正常"
fi
