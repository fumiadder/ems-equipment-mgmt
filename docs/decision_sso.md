# 技术决策记录 — SSO 集成方案

## 决策编号
OI-05

## 背景
系统权限管理支持 SSO 集成，需确定使用 LDAP 还是 OAuth2.0 方案。这取决于工厂现有的 IT 基础设施。

## 候选方案对比

| 维度 | LDAP | OAuth2.0 / OIDC |
|------|------|-----------------|
| **适用场景** | 企业内网、Active Directory 环境 | 现代 Web 应用、云服务、多系统统一认证 |
| **认证方式** | 用户名+密码绑定到目录服务 | 授权码流程、隐式流程、客户端凭证 |
| **用户管理** | 集中在 LDAP/AD 目录 | 可对接 IdP（Keycloak/Auth0/自建） |
| **令牌机制** | 无（每次查 LDAP） | JWT Access Token + Refresh Token |
| **移动端支持** | ⚠️ 需要额外适配 | ✅ 原生支持 |
| **API 网关集成** | ⚠️ 需要自定义中间件 | ✅ 标准化（Bearer Token） |
| **多因子认证(MFA) | ⚠️ 需要额外配置 | ✅ IdP 原生支持 |
| **制造业工厂常见** | ✅ 大型工厂通常有 AD/LDAP | ✅ 新建系统或云化工厂常用 |

## 决策结果

**推荐方案：OAuth2.0 / OIDC（通过 Keycloak 自建 IdP），同时保留 LDAP 作为用户目录后端**

### 理由

1. **与现代 Web 架构一致**：系统采用 JWT 认证，OAuth2.0/OIDC 天然产出 JWT，与现有架构无缝集成
2. **Keycloak 支持 LDAP 联合**：如果工厂已有 AD/LDAP，Keycloak 可以将 LDAP 作为用户存储后端，实现"LDAP 存用户 + OAuth2.0 做认证"的最佳组合
3. **移动端友好**：PWA/React Native 均原生支持 OAuth2.0 授权码流程
4. **扩展性强**：Keycloak 支持 MFA、单点登出、跨系统 SSO、社交登录等，未来扩展无需改代码
5. **私有化部署**：Keycloak 支持容器化私有化部署，符合混合部署策略

### 架构示意

```
用户 → Keycloak(IdP) → LDAP/AD(用户目录)
                ↓
           JWT Token
                ↓
前端/移动端 → API 网关(Nginx) → 后端服务(验证JWT)
```

### 备选方案

如果工厂已有统一的 OAuth2.0/OIDC 认证平台（如企业微信、钉钉、Azure AD），则直接对接该平台，无需自建 Keycloak。

## 状态
✅ 已决策
