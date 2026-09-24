import studentAvatar from '@/assets/avatars/student.svg'
import teacherAvatar from '@/assets/avatars/teacher.svg'
import adminAvatar from '@/assets/avatars/admin.svg'
import { getRole } from '@/utils/auth'

/** 角色默认头像：1学生 2老师 3管理员 */
const ROLE_DEFAULT_AVATARS = {
  1: studentAvatar,
  2: teacherAvatar,
  3: adminAvatar,
  student: studentAvatar,
  teacher: teacherAvatar,
  admin: adminAvatar
}

/**
 * 是否为用户自定义头像（非空且非占位无效地址）
 */
export function hasCustomAvatar(avatar) {
  if (avatar == null) return false
  const url = String(avatar).trim()
  if (!url) return false
  // 常见无效占位
  if (/^(null|undefined|n\/a|xxx+)$/i.test(url)) return false
  return true
}

/**
 * 根据角色取默认头像
 * @param {number|string} role 角色ID或 role 字符串
 */
export function getDefaultAvatarByRole(role) {
  if (role == null || role === '') {
    return studentAvatar
  }
  return ROLE_DEFAULT_AVATARS[role] || ROLE_DEFAULT_AVATARS[String(role)] || studentAvatar
}

/**
 * 解析最终展示头像：有自定义则用自定义，否则按角色默认
 * @param {string} avatar 用户头像 URL
 * @param {number|string} role 角色
 */
export function resolveAvatar(avatar, role) {
  if (hasCustomAvatar(avatar)) {
    return String(avatar).trim()
  }
  const resolvedRole = role != null && role !== '' ? role : getRole()
  return getDefaultAvatarByRole(resolvedRole)
}

export { studentAvatar, teacherAvatar, adminAvatar }
