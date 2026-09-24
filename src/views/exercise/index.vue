
<template>
  <div
    v-loading="pageLoading"
    element-loading-text="正在查询请等待"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(232, 242, 239, 0.72)"
    class="app-container page-loading-host">
    <el-form :inline="true" class="demo-form-inline">
      <el-form-item label="题库名称：">
        <el-input v-model="repoTitle" />
      </el-form-item>
      <el-form-item label="题库分类：">
        <el-select v-model="categoryId" placeholder="请选择分类" clearable>
          <el-option
            v-for="item in categoryOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="queryRepo()">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table class="flex-list-table"
      v-if="!isMobile"
      :data="data.records"
      border
      fit
      highlight-current-row
      empty-text="暂无本班可刷题库，请联系老师在题库中勾选班级"
      :header-cell-style="{
        background: '#eef6f3',
        color: '#555',
        'font-weight': 'bold',
        'line-height': '32px',
      }"
    >
      <el-table-column align="center" type="selection" min-width="48" />
      <el-table-column label="序号" align="center" min-width="56">
        <template slot-scope="scope">{{ scope.$index + 1 }}</template>
      </el-table-column>
      <el-table-column min-width="120" prop="repoTitle" label="题库标题" align="center" />
      <el-table-column min-width="110" prop="categoryName" label="题库分类" align="center">
        <template slot-scope="{ row }">
          <span v-if="row.parentCategoryName">{{ row.parentCategoryName }} / </span>
          <span>{{ row.categoryName || '未分类' }}</span>
        </template>
      </el-table-column>
      <el-table-column min-width="80" prop="totalCount" label="试题总数" align="center" />

      <el-table-column min-width="140" label="操作" align="center">
        <template slot-scope="{ row }">
          <el-button
            type="success"
            plain
            :disabled="row.totalCount == 0"
            size="small"
            @click="screenInfo(row.id, row.repoTitle)"
          >开始刷题</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-else class="h5-card-list">
      <div v-if="!(data.records && data.records.length)" class="h5-card-empty">暂无本班可刷题库，请联系老师在题库中勾选班级</div>
      <div v-for="(row, index) in (data.records || [])" :key="row.id || index" class="h5-card">
        <div class="h5-card-title">{{ row.repoTitle }}</div>
        <div class="h5-card-row">
          <span>题库分类</span>
          <span>{{ row.parentCategoryName ? row.parentCategoryName + ' / ' : '' }}{{ row.categoryName || '未分类' }}</span>
        </div>
        <div class="h5-card-row"><span>试题总数</span><span>{{ row.totalCount }}</span></div>
        <div class="h5-card-actions">
          <el-button
            type="success"
            :disabled="row.totalCount == 0"
            size="small"
            @click="screenInfo(row.id, row.repoTitle)"
          >开始刷题</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-container">
      <el-pagination
        :current-page="data.current"
        :page-sizes="[10, 20, 30, 40]"
        :page-size="data.size"
        :layout="paginationLayout"
        :total="data.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
import { exercisePaging, getExerciseCategories } from '@/api/exercise'

import pageLoading from '@/mixin/pageLoading'
export default {
  mixins: [pageLoading],
  data() {
    return {
      pageNum: 1,
      pageSize: 10,
      data: {},
      repoTitle: '',
      categoryId: '',
      categoryOptions: [],
      dialogTableVisible: false,
      dialogFormVisible: false,
      formLabelWidth: '120px'
    }
  },

  created() {
    this.getExercisePage()
    this.fetchCategories()
  },
  methods: {
    queryRepo() {
      this.pageNum = 1
      this.getExercisePage(this.pageNum, this.pageSize, this.repoTitle, this.categoryId)
    },
    // 分页查询
    async getExercisePage(pageNum, pageSize, title = null, categoryId = null) {

      await this.withPageLoading(async () => {
        const params = { 
          pageNum: pageNum, 
          pageSize: pageSize, 
          title: title,
          categoryId: categoryId
        }
        const res = await exercisePaging(params)
        this.data = res.data

      })

      },
    // 获取学生有权限的分类列表
    async fetchCategories() {
      try {
        const res = await getExerciseCategories()
        if (res.code) {
          this.categoryOptions = (res.data || []).map((item) => ({
            id: item.id,
            name: item.parentName ? `${item.parentName} / ${item.name}` : item.name
          }))
        } else {
          this.$message.error(res.msg || '获取分类数据失败')
        }
      } catch (error) {
        console.error('获取分类失败:', error)
        this.$message.error('获取分类数据失败')
      }
    },
    screenInfo(id, repoTitle) {
      this.$router.push({ name: 'start-exercise', query: { repoId: id, repoTitle: repoTitle }})
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.getExercisePage(this.pageNum, val, this.repoTitle, this.categoryId)
    },
    handleCurrentChange(val) {
      this.pageNum = val
      this.getExercisePage(val, this.pageSize, this.repoTitle, this.categoryId)
    },
    handleClick(row) {
      console.log(row)
    }
  }
}
</script>

<style>
.pagination-container {
  margin-top: 20px;
  text-align: center;
}
</style>
