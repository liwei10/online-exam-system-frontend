<template>
  <div class="item-contain">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>个人信息</span>
        <el-button
          v-if="!isAdmin"
          style="float: right; padding: 3px 0; margin-right: 15px"
          type="text"
          size="mini"
          @click="addClassBt"
        >
          加入班级</el-button>
        <el-button
          type="text"
          size="mini"
          style="float: right; padding: 3px 0; margin-right: 15px"
          @click="fileDialogVisible = true"
        >编辑头像</el-button>
      </div>
      <div class="card-body">
        <div class="left">
          <div>
            <span>用户名:</span>
            <span> {{ data.userName }}</span>
          </div>
          <div>
            <span>真实姓名:</span>
            <span> {{ data.realName }}</span>
          </div>
          <div v-if="!isAdmin">
            <span>班级:</span>
            <div class="grade-list">
              <div v-if="!(data.grades && data.grades.length)" class="grade-empty">暂未加入班级</div>
              <div v-for="item in (data.grades || [])" :key="item.id" class="grade-item">
                <el-tag size="small" effect="plain">{{ item.gradeName }}</el-tag>
                <el-button type="text" size="mini" style="color:#f56c6c" @click="exitGrade(item)">退出</el-button>
              </div>
            </div>
          </div>
        </div>
        <el-dialog
          width="400px"
          :show-close="false"
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
              只能上传"png", "jpg", "jpeg",
              "bmp"文件，且不超过2MB。注:右上角头像，重新登录更新
            </div>
          </el-upload>
          <div slot="footer" class="dialog-footer">
            <el-button @click="fileDialogVisible = false">取 消</el-button>
            <el-button type="primary" @click="importAvatar">确 定</el-button>
          </div>
        </el-dialog>

        <el-dialog title="加入班级" :visible.sync="addClassDialogVisible">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form :model="form">
                <el-form-item label="班级口令">
                  <el-input v-model="form.code" autocomplete="off" />
                </el-form-item>
              </el-form>
            </el-col>
          </el-row>
          <div slot="footer" class="dialog-footer">
            <el-button
              @click="addClassDialogVisible = false"
            >取 消</el-button>
            <el-button type="primary" @click="addClass">确 定</el-button>
          </div>
        </el-dialog>
        <div class="right">
          <img
            style="
              width: 150px;
              height: 150px;
              border-radius: 200px;
            "
            :src="data.avatar"
            :key="data.avatar"
            referrerpolicy="no-referrer"
            alt=""
          >
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { exitUserGrade, getInfo, userAddClass, uploadAvatar } from '@/api/user'
import { getRole } from '@/utils/jwtUtils'
export default {
  data() {
    return {
      fileDialogVisible: false,
      fileList: [],
      data: {},
      form: {
        code: ''
      },
      isAdmin: false,
      addClassDialogVisible: false
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
      const res = await getInfo()
      if (res.code) {
        this.data = res.data
        if (res.data && res.data.avatar) {
          this.$store.commit('user/SET_AVATAR', res.data.avatar)
        }
      } else {
        this.$message.error('获取个人信息失败')
      }
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
      const params = { code: this.form.code }
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

<style scoped>
.item-contain {
  padding: 30px 100px 0;
  display: flex;
  justify-content: center;
  height: 60vh;
}

.box-card {
  padding: 15px;
  width: 70% !important;
}
.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both;
}

.card-body {
  height: 29em;
  display: flex;
  justify-content: space-evenly;
}
.left {
  display: flex;
  flex-direction: column;
  width: 380px;
  height: 100%;
  padding: 60px;
  border-right: 1px solid rgb(228, 232, 235);
  div {
    margin-bottom: 40px;
    font-size: 14px Base;
    span {
      display: inline-block;
      width: 115px;
    }
  }
}
.grade-list {
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  vertical-align: top;
  width: calc(100% - 120px);
}
.grade-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0 !important;
}
.grade-empty {
  color: #94a3b8;
  margin-bottom: 0 !important;
}
.right{
  padding: 60px;
}

@media screen and (max-width: 991px) {
  .item-contain {
    padding: 12px;
    height: auto;
  }
  .box-card {
    width: 100% !important;
  }
  .card-body {
    height: auto;
    flex-direction: column-reverse;
    align-items: center;
  }
  .left {
    width: 100%;
    padding: 16px 8px;
    border-right: none;
  }
  .right {
    padding: 16px 8px;
  }
}
</style>
