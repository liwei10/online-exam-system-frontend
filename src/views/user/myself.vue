<template>
  <div
    v-loading="pageLoading"
    element-loading-text="正在查询请等待"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(232, 242, 239, 0.72)"
    class="item-contain page-loading-host"
  >
    <el-card class="box-card" shadow="never">
      <div slot="header" class="card-header">
        <span class="card-title">个人信息</span>
        <div class="header-actions">
          <el-button
            type="primary"
            plain
            size="small"
            icon="el-icon-picture-outline"
            @click="fileDialogVisible = true"
          >编辑头像</el-button>
          <el-button
            v-if="!isAdmin"
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="addClassBt"
          >加入班级</el-button>
        </div>
      </div>

      <div class="card-body">
        <div class="left">
          <div class="info-row">
            <span class="info-label">用户名</span>
            <div class="info-value-wrap">
              <span class="info-value">{{ data.userName }}</span>
              <span class="info-hint">唯一标识，不可修改</span>
            </div>
          </div>
          <div class="info-row info-row--edit">
            <span class="info-label">真实姓名</span>
            <div class="info-value-wrap">
              <el-input
                v-model="realNameDraft"
                maxlength="50"
                show-word-limit
                clearable
                placeholder="请输入真实姓名"
                class="realname-input"
              />
              <el-button
                type="primary"
                size="small"
                :disabled="!canSaveRealName"
                :loading="savingProfile"
                @click="saveRealName"
              >保存</el-button>
            </div>
          </div>
          <div v-if="!isAdmin" class="info-row info-row--grades">
            <span class="info-label">班级</span>
            <div class="grade-list">
              <div v-if="!(data.grades && data.grades.length)" class="grade-empty">
                暂未加入班级，点击右上角「加入班级」
              </div>
              <div
                v-for="item in (data.grades || [])"
                :key="item.id"
                class="grade-item"
              >
                <div class="grade-name">
                  <i class="el-icon-school grade-icon" />
                  <span :title="item.gradeName">{{ item.gradeName }}</span>
                </div>
                <el-button
                  class="exit-btn"
                  size="mini"
                  plain
                  @click="exitGrade(item)"
                >退出</el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="right">
          <img
            class="profile-avatar"
            :src="displayAvatar"
            :key="displayAvatar"
            referrerpolicy="no-referrer"
            alt=""
            @error="onAvatarError"
          >
          <p class="avatar-tip">{{ hasCustom ? '自定义头像' : '角色默认头像' }}</p>
          <el-button
            v-if="hasCustom"
            class="reset-avatar-btn"
            type="text"
            size="small"
            icon="el-icon-refresh-left"
            @click="resetDefaultAvatar"
          >恢复默认头像</el-button>
        </div>
      </div>
    </el-card>

    <el-dialog
      class="profile-dialog"
      width="420px"
      :show-close="true"
      :close-on-click-modal="false"
      title="上传头像"
      :visible.sync="fileDialogVisible"
    >
      <el-upload
        class="upload-demo"
        drag
        action="xxxxxx"
        multiple
        :limit="1"
        accept="png, jpg, jpeg, bmp"
        :auto-upload="false"
        :on-remove="handleRemove"
        :on-change="handleFileChange"
        :file-list="fileList"
      >
        <i class="el-icon-upload" />
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <div slot="tip" class="el-upload__tip">
          支持 png / jpg / jpeg / bmp，不超过 2MB
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button @click="fileDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="importAvatar">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      class="profile-dialog"
      title="加入班级"
      width="420px"
      :visible.sync="addClassDialogVisible"
      @closed="form.code = ''"
    >
      <p class="join-hint">请输入老师提供的班级口令，加入后即可参加该班级考试。</p>
      <el-form :model="form" label-position="top" @submit.native.prevent>
        <el-form-item label="班级口令">
          <el-input
            v-model="form.code"
            placeholder="请输入班级口令"
            clearable
            maxlength="32"
            prefix-icon="el-icon-key"
            @keyup.enter.native="addClass"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addClassDialogVisible = false">取 消</el-button>
        <el-button type="primary" :disabled="!form.code" @click="addClass">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { exitUserGrade, getInfo, userAddClass, uploadAvatar, resetAvatar, updateProfile } from '@/api/user'
import { getRole } from '@/utils/jwtUtils'
import { resolveAvatar, getDefaultAvatarByRole, hasCustomAvatar } from '@/utils/avatar'
import pageLoading from '@/mixin/pageLoading'

export default {
  mixins: [pageLoading],
  data() {
    return {
      fileDialogVisible: false,
      fileList: [],
      data: {},
      realNameDraft: '',
      savingProfile: false,
      form: {
        code: ''
      },
      isAdmin: false,
      addClassDialogVisible: false,
      forceRoleDefault: false
    }
  },
  computed: {
    hasCustom() {
      return hasCustomAvatar(this.data && this.data.avatar) && !this.forceRoleDefault
    },
    displayAvatar() {
      const role = (this.data && this.data.roleId) || getRole()
      if (this.forceRoleDefault) {
        return getDefaultAvatarByRole(role)
      }
      return resolveAvatar(this.data && this.data.avatar, role)
    },
    canSaveRealName() {
      const draft = (this.realNameDraft || '').trim()
      const current = (this.data && this.data.realName) || ''
      return !!draft && draft !== current
    }
  },
  created() {
    const role = getRole()
    if (role === 3 || role === 2) {
      this.isAdmin = true
    }
    this.getInfoFun()
  },
  methods: {
    onAvatarError() {
      if (!this.forceRoleDefault && hasCustomAvatar(this.data && this.data.avatar)) {
        this.forceRoleDefault = true
      }
    },
    saveRealName() {
      const realName = (this.realNameDraft || '').trim()
      if (!realName) {
        this.$message.warning('请输入真实姓名')
        return
      }
      this.savingProfile = true
      updateProfile({ realName })
        .then((res) => {
          if (res.code) {
            this.data = { ...this.data, realName }
            this.realNameDraft = realName
            this.$message.success(res.msg || '修改成功')
          } else {
            this.$message.error(res.msg || '修改失败')
          }
        })
        .catch(() => {
          this.$message.error('修改失败')
        })
        .finally(() => {
          this.savingProfile = false
        })
    },
    resetDefaultAvatar() {
      this.$confirm('确定恢复为角色默认头像吗？自定义头像将被清除。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        resetAvatar().then((res) => {
          if (res.code) {
            this.data = { ...this.data, avatar: '' }
            this.forceRoleDefault = false
            this.$store.commit('user/SET_AVATAR', '')
            this.getInfoFun()
            this.$message.success(res.msg || '已恢复默认头像')
          } else {
            this.$message.error(res.msg || '操作失败')
          }
        }).catch(() => {
          this.$message.error('操作失败')
        })
      }).catch(() => {})
    },
    exitGrade(item) {
      const name = (item && item.gradeName) || '该班级'
      this.$confirm(`退出班级「${name}」, 是否继续?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          exitUserGrade(item && item.id)
            .then((res) => {
              if (res.code) {
                this.getInfoFun()
                this.$message({
                  type: 'success',
                  message: '退出成功!'
                })
              } else {
                this.$message({
                  type: 'error',
                  message: res.msg
                })
              }
            })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消退出'
          })
        })
    },
    async getInfoFun() {
      await this.withPageLoading(async() => {
        const res = await getInfo()
        if (res.code) {
          this.data = res.data
          this.realNameDraft = (res.data && res.data.realName) || ''
          this.forceRoleDefault = false
          if (res.data && res.data.avatar) {
            this.$store.commit('user/SET_AVATAR', res.data.avatar)
          } else {
            this.$store.commit('user/SET_AVATAR', '')
          }
        } else {
          this.$message.error('获取个人信息失败')
        }
      })
    },
    handleFileChange(file, fileList) {
      this.fileList = fileList
    },
    handleRemove(file, fileList) {
      if (fileList.length === 0) {
        this.hasFiles = false
      }
    },
    importAvatar() {
      if (this.fileList.length > 0) {
        const formData = new FormData()
        formData.append('file', this.fileList[0].raw)
        uploadAvatar(formData)
          .then((res) => {
            if (res.code) {
              const avatarUrl = res.data
              this.$store.commit('user/SET_AVATAR', avatarUrl)
              this.data = { ...this.data, avatar: avatarUrl }
              this.forceRoleDefault = false
              this.getInfoFun()
              this.$message.success('文件上传成功！')
              this.fileDialogVisible = false
              this.fileList = []
            }
          })
          .catch((error) => {
            console.error('文件上传失败：', error)
            this.$message.error('文件上传失败！')
          })
      } else {
        this.$message.warning('请选择文件后再上传！')
      }
    },
    addClassBt() {
      this.addClassDialogVisible = true
    },
    addClass() {
      if (!this.form.code || !String(this.form.code).trim()) {
        this.$message.warning('请输入班级口令')
        return
      }
      const params = { code: String(this.form.code).trim() }
      userAddClass(params).then((res) => {
        if (res.code) {
          this.addClassDialogVisible = false
          this.form.code = ''
          this.getInfoFun()
          this.$message({
            type: 'success',
            message: res.msg || '加入成功'
          })
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
  max-width: 880px;
  border-radius: 16px;
  border: 1px solid #d7e3df;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #102a2a;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.card-body {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  min-height: 280px;
  padding: 8px 8px 16px;
}

.left {
  flex: 1;
  min-width: 0;
  padding-right: 24px;
  border-right: 1px solid #eaf2ef;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 22px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  flex: 0 0 88px;
  padding-top: 6px;
  font-size: 13px;
  color: #5b6f6c;
  font-weight: 500;
}

.info-value {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
  font-size: 15px;
  font-weight: 600;
  color: #102a2a;
  word-break: break-all;
}

.info-value-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.info-hint {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
}

.info-row--edit .info-label {
  padding-top: 10px;
}

.realname-input {
  width: 240px;
  max-width: 100%;
}

.info-row--grades {
  .info-label {
    padding-top: 12px;
  }
}

.grade-list {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grade-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #f4f7f6;
  border: 1px solid #e4eeea;
  border-radius: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: #99d5c8;
    box-shadow: 0 4px 12px rgba(15, 118, 110, 0.06);
  }
}

.grade-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #0f766e;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.grade-icon {
  flex-shrink: 0;
  font-size: 15px;
  color: #0d9488;
}

.exit-btn {
  flex-shrink: 0;
  color: #b45353 !important;
  border-color: rgba(180, 83, 83, 0.35) !important;
  background: #fff !important;
  padding: 5px 12px !important;

  &:hover,
  &:focus {
    color: #fff !important;
    background: #b45353 !important;
    border-color: #b45353 !important;
  }
}

.grade-empty {
  padding: 14px 12px;
  font-size: 13px;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px dashed #d7e3df;
  border-radius: 10px;
}

.right {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 12px;
}

.profile-avatar {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #d7e3df;
  box-shadow: 0 8px 24px rgba(15, 118, 110, 0.12);
}

.avatar-tip {
  margin: 12px 0 0;
  font-size: 12px;
  color: #7d9590;
}

.reset-avatar-btn {
  margin-top: 4px !important;
  color: #5b6f6c !important;
  font-size: 13px !important;

  &:hover {
    color: #0f766e !important;
  }
}

.join-hint {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #5b6f6c;
}

@media screen and (max-width: 991px) {
  .item-contain {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-body {
    flex-direction: column-reverse;
    align-items: center;
    gap: 20px;
    min-height: auto;
  }

  .left {
    width: 100%;
    padding-right: 0;
    border-right: none;
  }

  .right {
    flex-basis: auto;
    padding-top: 0;
  }
}
</style>
