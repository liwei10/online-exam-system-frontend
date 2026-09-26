<template>
  <div class="question-preview">
    <p v-if="stemText" class="preview-stem">{{ stemText }}</p>
    <p v-else class="preview-empty">暂无题干内容</p>

    <div v-if="image" class="preview-image-wrap">
      <el-image :src="image" :preview-src-list="[image]" class="preview-image" fit="contain" />
    </div>

    <audio-player :src="audio" />

    <!-- 单选 / 判断 -->
    <div v-if="typeNum === 1 || typeNum === 3" class="preview-options">
      <el-radio-group v-model="radioValue">
        <el-radio
          v-for="(item, idx) in visibleOptions"
          :key="'radio-' + idx"
          :label="optionKey(item, idx)"
          class="preview-option-item"
        >
          <span class="option-content">{{ optionLetter(idx) }}.{{ item.content }}</span>
          <div v-if="item.image" class="option-image-wrap">
            <el-image :src="item.image" :preview-src-list="[item.image]" class="option-image" fit="contain" />
          </div>
        </el-radio>
      </el-radio-group>
      <p v-if="!visibleOptions.length" class="preview-empty">暂无选项</p>
    </div>

    <!-- 多选 -->
    <div v-else-if="typeNum === 2" class="preview-options">
      <el-checkbox-group v-model="multiValue">
        <el-checkbox
          v-for="(item, idx) in visibleOptions"
          :key="'check-' + idx"
          :label="optionKey(item, idx)"
          class="preview-option-item"
        >
          <span class="option-content">{{ optionLetter(idx) }}.{{ item.content }}</span>
          <div v-if="item.image" class="option-image-wrap">
            <el-image :src="item.image" :preview-src-list="[item.image]" class="option-image" fit="contain" />
          </div>
        </el-checkbox>
      </el-checkbox-group>
      <p v-if="!visibleOptions.length" class="preview-empty">暂无选项</p>
    </div>

    <!-- 简答 -->
    <div v-else-if="typeNum === 4" class="preview-saq">
      <el-input
        v-model="saqText"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 6 }"
        placeholder="请输入内容"
      />
    </div>

    <!-- 填空 -->
    <div v-else-if="typeNum === 5" class="fill-blank-area">
      <div
        v-for="idx in blankCount"
        :key="'fill-' + idx"
        class="fill-blank-row"
      >
        <span class="fill-blank-label">空{{ idx }}：</span>
        <el-input
          :value="fillAnswers[idx - 1]"
          placeholder="请输入该空答案"
          clearable
          @input="onFillInput(idx - 1, $event)"
        />
      </div>
      <p v-if="blankCount === 0" class="preview-empty">题干中尚未检测到填空占位符</p>
    </div>

    <p v-else class="preview-empty">未知题型</p>

    <div v-if="showAnswerHint && answerHintRows.length" class="preview-answer-hint">
      <div class="preview-answer-hint-title">标准答案（仅预览可见，学生端不显示）</div>
      <div
        v-for="(row, i) in answerHintRows"
        :key="'hint-' + i"
        class="preview-answer-hint-row"
      >
        {{ row }}
      </div>
    </div>
  </div>
</template>

<script>
import AudioPlayer from '@/components/AudioPlayer'
import { countBlanks, renderStemWithBlanks } from '@/utils/blankPlaceholder'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default {
  name: 'QuestionPreview',
  components: { AudioPlayer },
  props: {
    quType: {
      type: [Number, String],
      default: 1
    },
    content: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    audio: {
      type: [String, Array],
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    },
    showAnswerHint: {
      type: Boolean,
      default: true
    },
    sortPrefix: {
      type: String,
      default: '1.'
    }
  },
  data() {
    return {
      radioValue: null,
      multiValue: [],
      saqText: '',
      fillAnswers: []
    }
  },
  computed: {
    typeNum() {
      return Number(this.quType) || 0
    },
    visibleOptions() {
      return (this.options || []).filter(o => o && !o.isDeleted)
    },
    blankCount() {
      return this.typeNum === 5 ? countBlanks(this.content) : 0
    },
    stemText() {
      if (!this.content) return ''
      const body = this.typeNum === 5
        ? renderStemWithBlanks(this.content)
        : this.content
      return this.sortPrefix + body
    },
    answerHintRows() {
      const opts = this.visibleOptions
      if (this.typeNum === 1 || this.typeNum === 3) {
        const rights = opts
          .map((o, i) => (o.isRight ? this.optionLetter(i) + '. ' + (o.content || '') : null))
          .filter(Boolean)
        return rights.length ? rights : ['（未标注正确答案）']
      }
      if (this.typeNum === 2) {
        const rights = opts
          .map((o, i) => (o.isRight ? this.optionLetter(i) + '. ' + (o.content || '') : null))
          .filter(Boolean)
        return rights.length ? rights : ['（未标注正确答案）']
      }
      if (this.typeNum === 4) {
        const text = opts.map(o => o.content || '').filter(Boolean).join('\n')
        return [text || '（未填写）']
      }
      if (this.typeNum === 5) {
        if (!opts.length && this.blankCount === 0) return []
        const rows = []
        const n = Math.max(this.blankCount, opts.length)
        for (let i = 0; i < n; i++) {
          const opt = opts[i]
          const ans = opt && opt.content != null ? String(opt.content) : ''
          rows.push(`空${i + 1}：${ans || '（未填写）'}`)
        }
        return rows
      }
      return []
    }
  },
  watch: {
    blankCount: {
      immediate: true,
      handler(n) {
        const next = []
        for (let i = 0; i < n; i++) {
          next.push(this.fillAnswers[i] != null ? this.fillAnswers[i] : '')
        }
        this.fillAnswers = next
      }
    },
    quType() {
      this.radioValue = null
      this.multiValue = []
      this.saqText = ''
    }
  },
  methods: {
    optionLetter(idx) {
      return LETTERS[idx] || `(${idx + 1})`
    },
    optionKey(item, idx) {
      if (item && item.id != null) return item.id
      return 'opt-' + idx
    },
    onFillInput(index, val) {
      this.$set(this.fillAnswers, index, val)
    }
  }
}
</script>

<style scoped>
.question-preview {
  color: #334155;
  line-height: 1.7;
}

.preview-stem {
  margin: 0 0 12px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 15px;
  color: #1e293b;
}

.preview-empty {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 13px;
}

.preview-image-wrap {
  margin-bottom: 12px;
}

.preview-image {
  max-width: 100%;
  max-height: 280px;
}

.preview-options {
  margin-top: 8px;
}

.preview-options >>> .el-radio,
.preview-options >>> .el-checkbox {
  display: flex;
  align-items: flex-start;
  margin: 0 0 12px;
  white-space: normal;
  height: auto;
}

.preview-options >>> .el-radio__label,
.preview-options >>> .el-checkbox__label {
  white-space: normal;
  line-height: 1.6;
}

.option-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.option-image-wrap {
  margin-top: 6px;
}

.option-image {
  max-width: 220px;
  max-height: 160px;
}

.preview-saq {
  margin-top: 8px;
}

.fill-blank-area {
  margin-top: 12px;
}

.fill-blank-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.fill-blank-label {
  flex-shrink: 0;
  width: 56px;
  color: #334155;
}

.preview-answer-hint {
  margin-top: 20px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  font-size: 13px;
}

.preview-answer-hint-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: #64748b;
}

.preview-answer-hint-row {
  color: #475569;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
