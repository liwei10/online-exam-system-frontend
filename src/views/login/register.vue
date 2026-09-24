<template>
  <div class="login-page">
    <div class="login-bg" aria-hidden="true">
      <span class="wash wash-a" />
      <span class="wash wash-b" />
      <span class="grain" />
    </div>

    <div class="login-stage register-stage">
      <aside class="brand-pane">
        <div class="brand-visual" aria-hidden="true">
          <span class="sheet sheet-a" />
          <span class="sheet sheet-b" />
          <span class="mark" />
        </div>
        <div class="brand-copy">
          <p class="brand-name">校园在线考试系统</p>
          <p class="brand-line">创建账号，开启练习与考试之旅</p>
          <ul class="brand-points">
            <li style="--i: 0">组卷阅卷一体，流程更顺</li>
            <li style="--i: 1">刷题即时反馈，巩固更快</li>
            <li style="--i: 2">班级权限清晰，管理更省心</li>
          </ul>
        </div>
      </aside>

      <section class="form-pane">
        <el-form
          ref="registerForm"
          :model="registerForm"
          :rules="loginRules"
          class="login-form"
          auto-complete="on"
          label-position="top"
        >
          <header class="form-head">
            <h2 class="form-title">注册账号</h2>
            <p class="form-sub">填写信息完成注册</p>
          </header>

          <el-form-item prop="userName" label="用户名">
            <div class="field">
              <span class="field-icon">
                <svg-icon icon-class="user" />
              </span>
              <el-input
                ref="username"
                v-model="registerForm.userName"
                placeholder="请输入用户名"
                name="username"
                type="text"
                tabindex="1"
                auto-complete="on"
              />
            </div>
          </el-form-item>

          <el-form-item prop="realName" label="真实姓名">
            <div class="field">
              <span class="field-icon">
                <svg-icon icon-class="user" />
              </span>
              <el-input
                ref="realName"
                v-model="registerForm.realName"
                placeholder="请输入真实姓名"
                name="realName"
                type="text"
                tabindex="2"
                auto-complete="on"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password" label="密码">
            <div class="field">
              <span class="field-icon">
                <svg-icon icon-class="password" />
              </span>
              <el-input
                :key="passwordType"
                ref="password"
                v-model="registerForm.password"
                :type="passwordType"
                placeholder="请输入密码"
                name="password"
                tabindex="3"
                auto-complete="on"
              />
              <span class="field-action" @click="showPwd">
                <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
              </span>
            </div>
          </el-form-item>

          <el-form-item prop="checkedPassword" label="确认密码">
            <div class="field">
              <span class="field-icon">
                <svg-icon icon-class="password" />
              </span>
              <el-input
                :key="checkedPasswordType"
                ref="checkedPassword"
                v-model="registerForm.checkedPassword"
                :type="checkedPasswordType"
                placeholder="请再次输入密码"
                name="checkedPassword"
                tabindex="4"
                auto-complete="on"
              />
              <span class="field-action" @click="showPwd2">
                <svg-icon :icon-class="checkedPasswordType === 'password' ? 'eye' : 'eye-open'" />
              </span>
            </div>
          </el-form-item>

          <el-form-item prop="code" label="验证码">
            <div class="captcha-row">
              <div class="field captcha-field">
                <span class="field-icon">
                  <svg-icon icon-class="code" />
                </span>
                <el-input
                  ref="code"
                  v-model="registerForm.code"
                  placeholder="请输入验证码"
                  name="code"
                  type="text"
                  tabindex="5"
                  auto-complete="off"
                  @keyup.enter.native="registerFn"
                />
              </div>
              <button
                type="button"
                class="captcha-btn"
                title="点击刷新验证码"
                @click="getVerify"
              >
                <img
                  ref="captchaImg"
                  class="captcha-img"
                  :src="captchaUrl"
                  alt="验证码"
                >
              </button>
            </div>
          </el-form-item>

          <div class="form-extra">
            <router-link class="link" to="/login">已有账号？去登录</router-link>
          </div>

          <el-button
            :loading="loading"
            type="primary"
            class="submit-btn"
            @click="registerFn"
          >注册</el-button>
        </el-form>
      </section>
    </div>

    <div v-if="icpNumber" class="icp-info">
      <a :href="icpLink" target="_blank">{{ icpNumber }}</a>
    </div>
  </div>
</template>

<script>
import { validUsername } from '@/utils/validate'
import { verifyCode, register } from '@/api/user'
import { Message } from 'element-ui'
import { Encrypt } from '@/utils/Secret'
export default {
  name: 'Register',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!validUsername(value)) {
        callback(new Error('请输入正确的用户名'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (value.length < 6) {
        callback(new Error('密码不能少于6位'))
      } else {
        callback()
      }
    }
    const validateRealName = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入真实姓名'))
      } else {
        callback()
      }
    }
    const validateCheckedPassword = (rule, value, callback) => {
      if (value != this.registerForm.password) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }
    const validateCode = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入验证码'))
      } else {
        callback()
      }
    }
    return {
      icpNumber: process.env.VUE_APP_ICP_NUMBER,
      icpLink: process.env.VUE_APP_ICP_LINK,
      registerForm: {
        userName: '',
        password: '',
        realName: '',
        checkedPassword: '',
        code: ''
      },
      loginRules: {
        userName: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }],
        realName: [{ required: true, trigger: 'blur', validator: validateRealName }],
        checkedPassword: [{ required: true, trigger: 'blur', validator: validateCheckedPassword }],
        code: [{ required: true, trigger: 'blur', validator: validateCode }]
      },
      loading: false,
      passwordType: 'password',
      checkedPasswordType: 'password',
      redirect: undefined,
      captchaUrl: `/api/auths/captcha?t=${Date.now()}`
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  created() {
    this.refreshCaptcha()
  },
  mounted() {
    this.$nextTick(() => {
      this.refreshCaptcha()
    })
  },
  activated() {
    this.refreshCaptcha()
  },
  methods: {
    refreshCaptcha() {
      this.registerForm.code = ''
      this.captchaUrl = `/api/auths/captcha?t=${Date.now()}`
    },
    registerFn() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          verifyCode(this.registerForm.code).then((res) => {
            if (res.code) {
              const registerData = {
                userName: this.registerForm.userName,
                realName: this.registerForm.realName,
                password: Encrypt(this.registerForm.password),
                checkedPassword: Encrypt(this.registerForm.checkedPassword)
              }
              register(registerData).then((res2) => {
                if (res2.code) {
                  Message({
                    message: res2.msg,
                    type: 'success',
                    duration: 5 * 1000
                  })
                  this.$router.push({ path: '/login' })
                } else {
                  this.refreshCaptcha()
                  Message({
                    message: res2.msg,
                    type: 'error',
                    duration: 5 * 1000
                  })
                }
              }).catch(() => {
                this.refreshCaptcha()
                Message({
                  message: '注册失败，请重试',
                  type: 'error',
                  duration: 5 * 1000
                })
              })
            } else {
              this.refreshCaptcha()
              Message({
                message: res.msg || '验证码验证失败',
                type: 'error',
                duration: 5 * 1000
              })
            }
          }).catch(() => {
            this.refreshCaptcha()
            Message({
              message: '验证码验证失败',
              type: 'error',
              duration: 5 * 1000
            })
          })
        } else {
          Message({
            message: '请填写完整的注册信息',
            type: 'warning',
            duration: 5 * 1000
          })
        }
      })
    },
    getVerify() {
      this.refreshCaptcha()
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    showPwd2() {
      if (this.checkedPasswordType === 'password') {
        this.checkedPasswordType = ''
      } else {
        this.checkedPasswordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.checkedPassword.focus()
      })
    }
  }
}
</script>

<style lang="scss">
$ink: #102a2a;
$muted: #5b6f6c;
$primary: #0f766e;
$field: #f4f7f6;

.login-page {
  font-family: 'Plus Jakarta Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

  .el-form-item {
    margin-bottom: 16px;

    .el-form-item__label {
      padding: 0 0 8px;
      line-height: 1.2;
      color: $ink;
      font-size: 13px;
      font-weight: 600;
    }

    .el-form-item__content {
      line-height: normal;
    }

    .el-form-item__error {
      padding-top: 4px;
      left: 2px;
    }
  }

  .el-input {
    flex: 1;
    min-width: 0;

    input {
      border: 0;
      background: transparent;
      height: 46px;
      line-height: 46px;
      padding: 0 8px 0 4px;
      color: $ink;
      font-size: 15px;
      caret-color: $primary;
      -webkit-appearance: none;
      border-radius: 0;

      &:-webkit-autofill {
        box-shadow: 0 0 0 1000px $field inset !important;
        -webkit-text-fill-color: $ink !important;
      }

      &::placeholder {
        color: #8aa09b;
      }
    }
  }

  .el-button--primary {
    background: $primary;
    border: none;
    border-radius: 12px;
    height: 48px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.06em;
    transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;

    &:hover,
    &:focus {
      background: #0d9488;
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(15, 118, 110, 0.28);
    }

    &:active {
      transform: translateY(0);
    }
  }
}
</style>

<style lang="scss" scoped>
$ink: #102a2a;
$muted: #5b6f6c;
$primary: #0f766e;
$field: #f4f7f6;
$line: #d7e3df;

.login-page {
  position: relative;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 20px 52px;
  background: #e8f2ef;
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wash {
  position: absolute;
  border-radius: 50%;
  filter: blur(8px);
}

.wash-a {
  width: 52vw;
  height: 52vw;
  left: -18vw;
  top: -20vw;
  background: radial-gradient(circle, rgba(45, 180, 160, 0.35), transparent 68%);
  animation: drift 18s ease-in-out infinite;
}

.wash-b {
  width: 46vw;
  height: 46vw;
  right: -14vw;
  bottom: -18vw;
  background: radial-gradient(circle, rgba(56, 140, 160, 0.28), transparent 68%);
  animation: drift 22s ease-in-out infinite reverse;
}

.grain {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    linear-gradient(rgba(16, 42, 42, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 42, 42, 0.035) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(ellipse 75% 70% at 50% 45%, #000 25%, transparent 80%);
}

@keyframes drift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(18px, -14px); }
}

.login-stage {
  position: relative;
  z-index: 1;
  width: min(980px, 100%);
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  min-height: 560px;
  background: #fff;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(16, 42, 42, 0.12);
  animation: stage-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.register-stage {
  min-height: 640px;
}

@keyframes stage-in {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.brand-pane {
  position: relative;
  padding: 48px 44px;
  color: #ecfdf8;
  background: linear-gradient(155deg, #0f766e 0%, #115e59 48%, #134e4a 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.brand-visual {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sheet {
  position: absolute;
  border-radius: 14px;
  border: 1px solid rgba(236, 253, 245, 0.22);
  background: rgba(236, 253, 245, 0.08);
}

.sheet-a {
  width: 180px;
  height: 230px;
  right: 56px;
  top: 58px;
  transform: rotate(8deg);
  animation: sheet-float-a 10s ease-in-out infinite;
}

.sheet-b {
  width: 150px;
  height: 190px;
  right: 28px;
  top: 96px;
  transform: rotate(-6deg);
  background: rgba(236, 253, 245, 0.12);
  animation: sheet-float-b 12s ease-in-out infinite;
}

.mark {
  position: absolute;
  width: 42px;
  height: 42px;
  right: 92px;
  top: 148px;
  border-radius: 50%;
  border: 2px solid rgba(167, 243, 208, 0.85);
  animation: pulse 3.6s ease-in-out infinite;
}

.mark::after {
  content: '';
  position: absolute;
  left: 11px;
  top: 8px;
  width: 12px;
  height: 20px;
  border-right: 2.5px solid rgba(167, 243, 208, 0.95);
  border-bottom: 2.5px solid rgba(167, 243, 208, 0.95);
  transform: rotate(40deg);
}

@keyframes sheet-float-a {
  0%, 100% { transform: translateY(0) rotate(8deg); }
  50% { transform: translateY(-10px) rotate(6deg); }
}

@keyframes sheet-float-b {
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50% { transform: translateY(-8px) rotate(-4deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.75; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.brand-copy {
  position: relative;
  z-index: 1;
  max-width: 22em;
}

.brand-name {
  margin: 0;
  font-family: 'Noto Serif SC', 'Songti SC', 'STSong', serif;
  font-size: clamp(30px, 3.4vw, 40px);
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: 0.02em;
  animation: rise 0.7s 0.08s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.brand-line {
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(204, 251, 241, 0.88);
  animation: rise 0.7s 0.16s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.brand-points {
  list-style: none;
  margin: 28px 0 0;
  padding: 0;

  li {
    position: relative;
    padding-left: 18px;
    margin-top: 10px;
    font-size: 14px;
    color: rgba(204, 251, 241, 0.8);
    animation: rise 0.65s calc(0.24s + var(--i) * 0.08s) cubic-bezier(0.22, 1, 0.36, 1) both;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 7px;
      height: 7px;
      border-radius: 2px;
      background: rgba(110, 231, 183, 0.9);
    }
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.form-pane {
  display: flex;
  align-items: center;
  padding: 32px 40px;
  background: #fff;
}

.login-form {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

.form-head {
  margin-bottom: 20px;
}

.form-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: $ink;
  letter-spacing: 0.01em;
}

.form-sub {
  margin: 8px 0 0;
  font-size: 14px;
  color: $muted;
}

.field {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 12px 0 4px;
  border: 1px solid $line;
  border-radius: 12px;
  background: $field;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: rgba(15, 118, 110, 0.55);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
}

.field-icon {
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #7d9590;
  flex-shrink: 0;
}

.field-action {
  width: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #7d9590;
  cursor: pointer;
  flex-shrink: 0;
}

.captcha-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.captcha-field {
  flex: 1;
  min-width: 0;
}

.captcha-btn {
  width: 118px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid $line;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: rgba(15, 118, 110, 0.45);
  }
}

.captcha-img {
  display: block;
  width: 100%;
  height: 48px;
  object-fit: cover;
}

.form-extra {
  display: flex;
  justify-content: flex-end;
  margin: -2px 0 12px;
}

.link {
  color: $primary;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    color: #0d9488;
  }
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}

.icp-info {
  position: absolute;
  bottom: 14px;
  left: 0;
  width: 100%;
  text-align: center;
  z-index: 1;

  a {
    color: $muted;
    font-size: 12px;
    text-decoration: none;

    &:hover {
      color: $ink;
      text-decoration: underline;
    }
  }
}

@media screen and (max-width: 900px) {
  .login-stage {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .register-stage {
    min-height: auto;
  }

  .brand-pane {
    min-height: 200px;
    padding: 28px 24px 24px;
  }

  .sheet-a,
  .sheet-b,
  .mark {
    display: none;
  }

  .brand-name {
    font-size: 28px;
  }

  .brand-points {
    display: none;
  }

  .form-pane {
    padding: 24px 24px 32px;
  }
}
</style>
