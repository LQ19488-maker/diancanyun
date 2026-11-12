import { ref, reactive } from 'vue'

/**
 * 列表页通用逻辑：查询参数、分页、加载态、错误态。
 *
 * @param {(params) => Promise<{list: any[], total: number}>} fetcher
 * @param {{pageSize?: number, defaultQuery?: object, immediate?: boolean}} options
 */
export function useTable(fetcher, options = {}) {
  const { pageSize = 10, defaultQuery = {}, immediate = true } = options

  const list = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const page = ref(1)
  const size = ref(pageSize)
  const query = reactive({ ...defaultQuery })

  async function load() {
    loading.value = true
    error.value = null
    try {
      const res = await fetcher({ ...query, page: page.value, pageSize: size.value })
      list.value = res?.list || []
      total.value = Number(res?.total || 0)
      // 删掉末页最后一条后自动回退一页，避免停在空白页
      if (!list.value.length && total.value > 0 && page.value > 1) {
        page.value -= 1
        return load()
      }
    } catch (e) {
      error.value = e
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function search() {
    page.value = 1
    return load()
  }

  function reset() {
    Object.keys(query).forEach((k) => {
      query[k] = defaultQuery[k] ?? ''
    })
    return search()
  }

  function handlePage(p) {
    page.value = p
    return load()
  }

  function handleSize(s) {
    size.value = s
    page.value = 1
    return load()
  }

  if (immediate) load()

  return { list, total, loading, error, page, size, query, load, search, reset, handlePage, handleSize }
}
