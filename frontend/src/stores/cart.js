import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const CART_KEY = 'dcy_h5_cart'
const TABLE_KEY = 'dcy_h5_table'

/**
 * H5 购物车。
 * 同一菜品 + 同一口味选择 = 同一条记录（key 由 dishId + 口味拼接），
 * 整个购物车落 localStorage，切页面、刷新都不丢。
 */
export const useCartStore = defineStore('cart', () => {
  const items = ref(load())
  const tableNo = ref(localStorage.getItem(TABLE_KEY) || '3 号桌')

  function load() {
    try {
      const raw = localStorage.getItem(CART_KEY)
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }

  const totalCount = computed(() => items.value.reduce((s, x) => s + Number(x.quantity || 0), 0))
  const totalAmount = computed(() =>
    Number(items.value.reduce((s, x) => s + Number(x.price || 0) * Number(x.quantity || 0), 0).toFixed(2))
  )
  const isEmpty = computed(() => items.value.length === 0)

  function makeKey(dishId, selection = {}) {
    const parts = Object.keys(selection)
      .sort()
      .map((k) => `${k}:${selection[k]}`)
      .join('|')
    return `${dishId}#${parts}`
  }

  function add(dish, selection = {}, quantity = 1) {
    const key = makeKey(dish.id, selection)
    const hit = items.value.find((x) => x.key === key)
    if (hit) {
      hit.quantity += quantity
    } else {
      items.value.push({
        key,
        dishId: String(dish.id),
        name: dish.name,
        price: Number(dish.price),
        image: dish.image,
        selection,
        quantity
      })
    }
  }

  function inc(key) {
    const hit = items.value.find((x) => x.key === key)
    if (hit) hit.quantity += 1
  }

  function dec(key) {
    const hit = items.value.find((x) => x.key === key)
    if (!hit) return
    hit.quantity -= 1
    if (hit.quantity <= 0) remove(key)
  }

  function remove(key) {
    items.value = items.value.filter((x) => x.key !== key)
  }

  function clear() {
    items.value = []
  }

  function setTable(no) {
    tableNo.value = no
    localStorage.setItem(TABLE_KEY, no)
  }

  /** 下单请求体：{ tableNo, items: [{dishId, quantity, flavors:[{name,value}]}], remark } */
  function toOrderPayload(remark = '') {
    return {
      tableNo: tableNo.value,
      remark,
      items: items.value.map((x) => ({
        dishId: x.dishId,
        quantity: x.quantity,
        flavors: Object.entries(x.selection || {}).map(([name, value]) => ({ name, value }))
      }))
    }
  }

  watch(
    items,
    (val) => {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(val))
      } catch {
        /* 隐私模式忽略 */
      }
    },
    { deep: true }
  )

  return { items, tableNo, totalCount, totalAmount, isEmpty, add, inc, dec, remove, clear, setTable, toOrderPayload }
})
