/**
 * 填空题占位符与答案工具
 * 占位符：{{1}} {{2}}…
 * 学生多空分隔：|||
 * 同义答案分隔：|
 */

const PLACEHOLDER_RE = /\{\{(\d+)\}\}/g
const ANSWER_DELIMITER = '|||'

export function parseBlankIndexes(content) {
  if (!content) return []
  const indexes = []
  const re = new RegExp(PLACEHOLDER_RE.source, 'g')
  let m
  while ((m = re.exec(content)) !== null) {
    indexes.push(Number(m[1]))
  }
  return indexes
}

export function countBlanks(content) {
  return parseBlankIndexes(content).length
}

/**
 * @returns {string|null} 错误信息，通过则 null
 */
export function validateBlanks(content, optionCount) {
  const indexes = parseBlankIndexes(content)
  if (!indexes.length) {
    return '填空题题干至少需要一个占位符，请点击「插入填空」'
  }
  if (indexes.length !== optionCount) {
    return `填空题占位符数量(${indexes.length})与答案条数(${optionCount})不一致`
  }
  for (let i = 0; i < indexes.length; i++) {
    if (indexes[i] !== i + 1) {
      return `填空题占位符必须从 {{1}} 起连续编号，当前第 ${i + 1} 个为 {{${indexes[i]}}}`
    }
  }
  return null
}

export function splitAnswers(answerContent) {
  if (answerContent == null || answerContent === '') return []
  return String(answerContent).split(ANSWER_DELIMITER).map(s => (s == null ? '' : String(s).trim()))
}

export function joinAnswers(answers) {
  if (!answers || !answers.length) return ''
  return answers.map(a => (a == null ? '' : String(a).trim())).join(ANSWER_DELIMITER)
}

export function matchBlank(userAnswer, standard) {
  const user = userAnswer == null ? '' : String(userAnswer).trim()
  if (standard == null || String(standard).trim() === '') {
    return user === ''
  }
  return String(standard).split('|').some(s => user === s.trim())
}

/**
 * 题干展示：{{n}} → ____①____ 形式
 */
export function renderStemWithBlanks(content) {
  if (!content) return ''
  return String(content).replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const num = Number(n)
    return ` ____${circleNumber(num)}____ `
  })
}

function circleNumber(n) {
  const circles = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
    '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳']
  if (n >= 1 && n <= circles.length) return circles[n - 1]
  return `(${n})`
}

/**
 * 在文本光标处插入下一个占位符，返回 { content, nextIndex }
 */
export function insertBlankAt(content, cursorStart, cursorEnd) {
  const text = content == null ? '' : String(content)
  const start = cursorStart == null ? text.length : cursorStart
  const end = cursorEnd == null ? start : cursorEnd
  const nextIndex = countBlanks(text) + 1
  const token = `{{${nextIndex}}}`
  const newContent = text.slice(0, start) + token + text.slice(end)
  return { content: newContent, nextIndex, token }
}

/**
 * 按题干占位符同步答案行，尽量保留已有答案
 */
export function syncOptionsFromContent(content, oldOptions) {
  const count = countBlanks(content)
  const old = oldOptions || []
  const next = []
  for (let i = 0; i < count; i++) {
    const prev = old[i]
    next.push({
      isRight: true,
      content: prev && prev.content != null ? prev.content : '',
      sort: i + 1,
      isDeleted: 0
    })
  }
  return next
}

export { ANSWER_DELIMITER }
