import { baseOption, THEME } from '@/composables/useChart'

/**
 * 营业额趋势：柱（营业额）+ 折线（订单量）双轴。
 * 为什么双轴：金额与单量量级差几十倍，同一根轴会让单量贴地看不清。
 */
export function turnoverTrendOption(trend = []) {
  const dates = trend.map((t) => String(t.date).slice(5))
  return baseOption({
    grid: { left: 8, right: 26, top: 36, bottom: 8, containLabel: true },
    legend: { top: 0, right: 6, itemWidth: 10, itemHeight: 8 },
    xAxis: {
      type: 'category',
      data: dates,
      axisTick: { show: false },
      axisLabel: { fontSize: 11 }
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { fontSize: 11, formatter: (v) => (v >= 1000 ? Math.round(v / 1000) + 'k' : v) },
        splitLine: { lineStyle: { color: '#eef1f6' } }
      },
      {
        type: 'value',
        axisLabel: { fontSize: 11 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '营业额(元)',
        type: 'bar',
        barMaxWidth: 22,
        itemStyle: { color: THEME.primary, borderRadius: [4, 4, 0, 0] },
        data: trend.map((t) => Number(t.turnover ?? 0))
      },
      {
        name: '订单量(单)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbolSize: 5,
        connectNulls: false,
        itemStyle: { color: THEME.warn },
        lineStyle: { width: 2 },
        data: trend.map((t) => Number(t.orderCount ?? 0))
      }
    ]
  })
}

/** 订单状态分布：环形图，标签带数量 */
export function statusDonutOption(dist = [], labelOf = (s) => s) {
  return baseOption({
    tooltip: { trigger: 'item', formatter: '{b}：{c} 单（{d}%）' },
    legend: { bottom: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
    series: [
      {
        type: 'pie',
        radius: ['46%', '68%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{c} 单', fontSize: 11 },
        labelLine: { length: 8, length2: 6 },
        data: dist.map((d) => ({ name: labelOf(d.status), value: Number(d.count ?? 0) }))
      }
    ]
  })
}

/** 热销菜品 Top N：横向条形（升序排列，最热的在最上面） */
export function hotBarOption(list = [], top = 8) {
  const rows = list.slice(0, top).slice().reverse()
  return baseOption({
    grid: { left: 8, right: 40, top: 20, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].name}<br/>销量 ${p[0].value} 份` },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
      splitLine: { lineStyle: { color: '#eef1f6' } }
    },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.name),
      axisTick: { show: false },
      axisLabel: { fontSize: 11 }
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: { color: THEME.accent, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', fontSize: 11, color: '#4b5563' },
        data: rows.map((r) => Number(r.count ?? 0))
      }
    ]
  })
}
