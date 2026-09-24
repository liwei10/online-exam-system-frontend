<template>
  <div class="item-contain">
    <el-card class="box-card" shadow="never">
      <div slot="header" class="card-header">
        <span class="card-title">修改密码</span>
      </div>
      <div class="card-body">
        <el-form
          ref="updatePasswordForm"
          :label-position="labelPosition"
          :model="updatePasswordForm"
          label-width="88px"
          class="pwd-form"
        >
          <el-form-item label="原密码">
            <el-input
              v-model="updatePasswordForm.originPassword"
              type="password"
              show-password
              autocomplete="off"
              placeholder="请输入原密码"
            />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input
              v-model="updatePasswordForm.newPassword"
              type="password"
              show-password
              autocomplete="off"
              placeholder="请输入新密码"
            />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input
              v-model="updatePasswordForm.checkedPassword"
              type="password"
              show-password
              autocomplete="off"
              placeholder="请再次输入新密码"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="updatePassword">确认修改</el-button>
            <el-button @click="cancelFun">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script>
import { changePassword } from '@/api/user'

export default {
  data() {
    return {
      labelPosition: 'right',
      updatePasswordForm: {
        originPassword: '',
        newPassword: '',
        checkedPassword: ''
      }
    }
  },
  methods: {
    cancelFun() {
      this.$router.push({ path: 'index' })
    },
    updatePassword() {
      const data = {
        originPassword: this.updatePasswordForm.originPassword,
        newPassword: this.updatePasswordForm.newPassword,
        checkedPassword: this.updatePasswordForm.checkedPassword
      }
      changePassword(data).then((res) => {
        if (res.code) {
          this.$message({
            type: 'success',
            message: '修改成功'
          })
          this.$router.push({ path: '/login', query: { zhi: 1 }})
        } else {
          this.$message({
            type: 'error',
            message: res.msg
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.item-contain {
  padding: 24px;
  display: flex;
  justify-content: center;
}

.box-card {
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
  border: 1px solid #d7e3df;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #102a2a;
}

.card-body {
  padding: 8px 12px 8px;
}

.pwd-form {
  max-width: 420px;
}

@media screen and (max-width: 991px) {
  .item-contain {
    padding: 12px;
  }
}
</style>
