/**
 * 导出 CSV（带 UTF-8 BOM，Excel 打开不乱码）。
 * @param {string} filename 文件名（不带扩展名）
 * @param {string[]} headers 表头
 * @param {Array<Array<any>>} rows 数据行
 */
export function downloadCsv(filename, headers, rows) {
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    // 含逗号/引号/换行时用双引号包裹，内部引号翻倍
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.map(escape).join(',')]
  rows.forEach((r) => lines.push(r.map(escape).join(',')))

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
