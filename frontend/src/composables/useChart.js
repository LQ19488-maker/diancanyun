import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
  DataZoomComponent
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, ref } from 'vue'

/** 按需注册：只打包用到的图类型与组件，否则产物会明显变大 */
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
  DataZoomComponent,
  SVGRenderer
])

/** 全站图表配色：主色/辅色/警示色与后台保持一致 */
export const THEME = {
  primary: '#1a4d8f',
  accent: '#0f766e',
  warn: '#b45309',
  purple: '#7c3aed',
  pink: '#db2777',
  cyan: '#0891b2',
  series: ['#1a4d8f', '#0f766e', '#b45309', '#7c3aed', '#db2777', '#0891b2', '#65a30d', '#94a3b8']
}

/** 公共 option：字体、grid、tooltip 统一在这里，各图表只写差异部分 */
export function baseOption(extra = {}) {
  return {
    color: THEME.series,
    textStyle: {
      fontFamily: '-apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',
      fontSize: 12
    },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,.96)',
      borderColor: '#e3e8ef',
      textStyle: { color: '#1f2937', fontSize: 12 }
    },
    ...extra
  }
}

/**
 * ECharts 封装：惰性初始化 + 容器自适应 + 卸载释放 + 导出 PNG。
 *
 * 踩过的坑（写在这里免得再犯）：
 *  1. 容器高度不能用 flex:1 撑，父元素高度不确定时会算成 0，图表是一片空白——必须在
 *     模板里用行内 style 写死高度；
 *  2. 容器可能在数据回来之后才显示，所以 init 放在 ensure() 里惰性做；
 *  3. setOption 之后补一次 resize()，容器刚显示时宽高还是 0。
 */
export function useChart(elRef) {
  const chart = ref(null)
  let observer = null

  function ensure() {
    const el = elRef.value
    if (!el) return null
    if (!chart.value) {
      chart.value = echarts.init(el, null, { renderer: 'svg' })
      if (typeof ResizeObserver !== 'undefined' && !observer) {
        observer = new ResizeObserver(() => chart.value?.resize())
        observer.observe(el)
      }
    }
    return chart.value
  }

  onMounted(ensure)

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
    chart.value?.dispose()
    chart.value = null
  })

  function setOption(option, opts = { notMerge: true }) {
    const c = ensure()
    if (!c || !option) return false
    c.setOption(option, opts)
    c.resize()
    return true
  }

  function resize() {
    chart.value?.resize()
  }

  /** 导出 PNG：2 倍像素、白底、文件名带时间戳 */
  function exportPng(name = 'chart') {
    if (!chart.value) return
    const url = chart.value.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.png`
    a.click()
  }

  return { chart, setOption, resize, exportPng }
}

export { echarts }
