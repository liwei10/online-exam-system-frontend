<template>
  <div
    v-loading="pageLoading"
    element-loading-text="正在查询请等待"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(232, 242, 239, 0.72)"
    class="app-container page-loading-host">
    <!-- form -->

    <el-form :inline="true" :model="formInline" class="demo-form-inline">
      <el-form-item label="班级">
        <el-input v-model="formInline.searchTitle" placeholder="输入班级名称" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="searchExam">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button v-if="role==3" :title="diaTitle" type="primary" @click="dialogTableVisible = true">
          新增</el-button>
      </el-form-item>
      <el-form-item>
        <el-button v-if="role==2" type="primary" @click="joinClassVisible = true">
          加入班级</el-button>
      </el-form-item>
    </el-form>

    <!-- table -->

    <el-table class="flex-list-table"
      :data="data.records"
      border
      fit
      highlight-current-row
      :header-cell-style="{
        background: '#eef6f3',
        color: '#555',
        'font-weight': 'bold',
        'line-height': '32px',
      }"
    >
      <el-table-column align="center" type="selection" min-width="48" />
      <el-table-column label="序号" align="center" min-width="56">
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="gradeName" label="班级名称" align="center" min-width="120" />
      <el-table-column prop="gradeCount" label="班级人数" align="center" min-width="100" />
      <el-table-column label="关联教师" align="center" min-width="180">
        <template slot-scope="{ row }">
          <template v-if="row.teachers && row.teachers.length">
            <el-tag
              v-for="t in row.teachers"
              :key="t.id"
              size="mini"
              effect="plain"
              type="info"
              style="margin: 2px"
            >{{ t.realName || t.userName }}</el-tag>
          </template>
          <span v-else class="empty-text">暂无</span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="班级口令" align="center" min-width="140" />
      <el-table-column prop="userName" label="创建用户" align="center" min-width="110" />
      <el-table-column align="center" label="操作" min-width="220">
        <template slot-scope="{ row }">
          <!-- 管理员按钮 -->
          <el-button
            v-if="role==3"
            type="text"
            size="small"
            style="font-size: 14px"
            @click="moveClass(row, 'up')"
          >上移</el-button>
          <el-button
            v-if="role==3"
            type="text"
            size="small"
            style="font-size: 14px"
            @click="moveClass(row, 'down')"
          >下移</el-button>
          <el-button
            v-if="role==3"
            type="text"
            size="small"
            style="font-size: 14px"
            @click="updateRow(row)"
          >编辑</el-button>

          <el-button
            v-if="role==3"
            type="text"
            size="small"
            style="color: red; font-size: 14px"
            @click="delClass(row)"
          >删除</el-button>
          <!-- 教师按钮 -->
          <el-button
            v-if="role==2"
            type="text"
            size="small"
            style="color: red; font-size: 14px"
            @click="exitClass(row)"
          >退出班级</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        :current-page="data.current"
        :page-sizes="[10, 20, 30, 40]"
        :page-size="data.size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="data.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <!--新增弹窗-->

    <el-dialog :title="diaTitle" :visible.sync="dialogTableVisible">
      <el-row>
        <el-form :model="addForm">
          <el-form-item label="班级名称" :label-width="formLabelWidth">
            <el-input v-model="addForm.gradeName" autocomplete="off" />
          </el-form-item>
        </el-form>
      </el-row>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogTableVisible = false">取 消</el-button>
        <el-button type="primary" @click="addClass">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="加入班级" :visible.sync="joinClassVisible">
      <el-row>
        <el-form :model="teacharForm">
          <el-form-item label="班级代码：" :label-width="formLabelWidth">
            <el-input v-model="teacharForm.classCode" autocomplete="off" />
          </el-form-item>
        </el-form>
      </el-row>

      <div slot="footer" class="dialog-footer">
        <el-button @click="joinClassVisible = false">取 消</el-button>
        <el-button type="primary" @click="joinClass">确 定</el-button>
      </div>
    </el-dialog>

    <!--编辑弹窗-->
    <el-dialog title="编辑班级" :visible.sync="dialogFormVisible" width="560px" @closed="onEditClosed">
      <el-form :model="form" label-width="90px">
        <el-form-item label="班级名称">
          <el-input v-model="form.gradeName" autocomplete="off" maxlength="50" />
        </el-form-item>
        <el-form-item label="关联教师">
          <div v-if="!(form.teachers && form.teachers.length)" class="teacher-empty">
            暂无关联教师
          </div>
          <div v-else class="teacher-list">
            <div
              v-for="t in form.teachers"
              :key="t.id"
              class="teacher-item"
            >
              <div class="teacher-meta">
                <span class="teacher-name">{{ t.realName || t.userName }}</span>
                <span class="teacher-username">{{ t.userName }}</span>
              </div>
              <el-button
                type="text"
                size="small"
                class="unbind-btn"
                :loading="unbindingId === t.id"
                @click="unbindTeacher(t)"
              >解除关联</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="updateClass">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { teacherJoinClass, teacherExitClass, classPaging, classDel, classUpdate, classAdd, removeTeacherFromGrade, classSort } from '@/api/class_'
import { getRole } from '@/utils/jwtUtils'
import pageLoading from '@/mixin/pageLoading'
export default {
  mixins: [pageLoading],
  data() {
    return {
      teacharForm: {
        classCode: ''
      },
      role: 0,
      pageNum: 1,
      pageSize: 10,
      data: {},
      diaTitle: '新增',
      joinClassVisible: false,
      dialogTableVisible: false,
      dialogFormVisible: false,
      unbindingId: null,
      addForm: {
        gradeName: ''
      },
      formInline: {
        searchTitle: ''
      },
      form: {
        id: null,
        gradeName: '',
        teachers: []
      },
      formLabelWidth: '110px'
    }
  },

  created() {
    this.getClassPage()
    this.role = getRole()
  },
  methods: {
    joinClass() {
      const params = { code: this.teacharForm.classCode }
      teacherJoinClass(params).then((res) => {
        if (res.code) {
          this.joinClassVisible = false
          this.getClassPage(this.pageNum, this.pageSize, this.formInline.searchTitle)
          this.$message({
            type: 'success',
            message: '加入成功!'
          })
        } else {
          this.$message({
            type: 'info',
            message: res.msg
          })
        }
      })
    },
    exitClass(row) {
      const classId = row['id']
      teacherExitClass(classId).then((res) => {
        if (res.code) {
          this.getClassPage(this.pageNum, this.pageSize, this.formInline.searchTitle)
          this.$message({
            type: 'success',
            message: '退出成功!'
          })
        } else {
          this.$message({
            type: 'info',
            message: res.msg
          })
        }
      })
    },
    async moveClass(row, direction) {
      try {
        const res = await classSort(row.id, direction)
        if (res.code) {
          this.$message.success(res.msg || '排序已更新')
          this.getClassPage(this.pageNum, this.pageSize, this.formInline.searchTitle)
        }
      } catch (e) {
        // 错误已由拦截器提示
      }
    },
    // 分页查询
    async getClassPage(pageNum, pageSize, title = null) {
      await this.withPageLoading(async() => {
        const params = { pageNum: pageNum, pageSize: pageSize, gradeName: title }
        const res = await classPaging(params)
        this.data = res.data
      })
    },
    addClass() {
      const data = { gradeName: this.addForm.gradeName }
      classAdd(data).then((res) => {
        if (res.code) {
          this.addForm.gradeName = ''
          this.getClassPage(this.pageNum, this.pageSize, this.formInline.searchTitle)
          this.dialogTableVisible = false
          this.$message({
            type: 'success',
            message: '新增成功!'
          })
        } else {
          this.$message({
            type: 'info',
            message: res.msg
          })
        }
      })
    },
    delClass(row) {
      this.$confirm('此操作将永久删除该班级, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      })
        .then(() => {
          classDel(row.id).then((res) => {
            if (res.code) {
              this.getClassPage(this.pageNum, this.pageSize, this.formInline.searchTitle)
              this.$message({
                type: 'success',
                message: '删除成功!'
              })
            } else {
              this.$message({
                type: 'info',
                message: res.msg
              })
            }
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    updateClass() {
      classUpdate(this.form.id, { gradeName: this.form.gradeName })
        .then((res) => {
          if (res.code) {
            this.getClassPage(this.pageNum, this.pageSize, this.formInline.searchTitle)
            this.dialogFormVisible = false
            this.$message({
              type: 'success',
              message: '编辑成功!'
            })
          } else {
            this.$message({
              type: 'info',
              message: res.msg
            })
          }
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '取消编辑'
          })
        })
    },
    updateRow(row) {
      this.form = {
        id: row.id,
        gradeName: row.gradeName,
        teachers: Array.isArray(row.teachers) ? row.teachers.map((t) => ({ ...t })) : []
      }
      this.dialogFormVisible = true
    },
    onEditClosed() {
      this.unbindingId = null
      this.form = { id: null, gradeName: '', teachers: [] }
    },
    unbindTeacher(teacher) {
      const name = (teacher && (teacher.realName || teacher.userName)) || '该教师'
      this.$confirm(`确定解除「${name}」与本班级的关联吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.unbindingId = teacher.id
        removeTeacherFromGrade(this.form.id, teacher.id)
          .then((res) => {
            if (res.code) {
              this.form.teachers = (this.form.teachers || []).filter((t) => t.id !== teacher.id)
              this.getClassPage(this.pageNum, this.pageSize, this.formInline.searchTitle)
              this.$message.success(res.msg || '已解除关联')
            } else {
              this.$message.error(res.msg || '解除失败')
            }
          })
          .catch(() => {
            this.$message.error('解除失败')
          })
          .finally(() => {
            this.unbindingId = null
          })
      }).catch(() => {})
    },
    searchExam() {
      this.getClassPage(this.pageNum, this.pageSize, this.formInline.searchTitle)
    },
    handleClick(row) {
      (row)
    },
    handleSizeChange(val) {
      // 设置每页多少条逻辑
      this.pageSize = val
      this.getClassPage(this.pageNum, val, this.formInline.searchTitle)
    },
    handleCurrentChange(val) {
      // 设置当前页逻辑
      this.pageNum = val
      this.getClassPage(val, this.pageSize, this.formInline.searchTitle)
    }
  }
}
</script>

<style scoped>
.empty-text {
  color: #94a3b8;
  font-size: 13px;
}

.teacher-empty {
  padding: 12px;
  font-size: 13px;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px dashed #d7e3df;
  border-radius: 8px;
}

.teacher-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.teacher-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #f4f7f6;
  border: 1px solid #e4eeea;
  border-radius: 8px;
}

.teacher-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.teacher-name {
  font-size: 14px;
  font-weight: 600;
  color: #102a2a;
}

.teacher-username {
  font-size: 12px;
  color: #7d9590;
}

.unbind-btn {
  color: #b45353 !important;
  flex-shrink: 0;
}
</style>
