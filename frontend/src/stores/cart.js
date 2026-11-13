import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const CART_KEY = 'dcy_h5_cart'
const SHOP_KEY = 'dcy_h5_shop'
const ADDR_KEY = 'dcy_h5_address'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, val) {
  try {
    if (val === null || val === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* 隐私模式下忽略 */
  }
}

/**
 * H5 购物车（外卖场景）。
 *  - 同一菜品 + 同一口味选择 = 同一条记录（key 由 dishId + 口味拼接）
 *  - 购物车、当前店铺、当前收货地址都落 localStorage，切页面、刷新都不丢
 *  - 金额口径：菜品小计 + 配送费 = 应付；未达起送价不允许提交
 */
export const useCartStore = defineStore('cart', () => {
  const items = ref(readJson(CART_KEY, []))
  if (!Array.isArray(items.value)) items.value = []
  const shop = ref(readJson(SHOP_KEY, null))
  const address = ref(readJson(ADDR_KEY, null))

  const totalCount = computed(() => items.value.reduce((s, x) => s + Number(x.quantity || 0), 0))
  const totalAmount = computed(() =>
    Number(items.value.reduce((s, x) => s + Number(x.price || 0) * Number(x.quantity || 0), 0).toFixed(2))
  )
  const isEmpty = computed(() => items.value.length === 0)

  /** 配送费 / 起送价都跟着当前店铺走 */
  const deliveryFee = computed(() => Number(shop.value?.deliveryFee || 0))
  const minPrice = computed(() => Number(shop.value?.minPrice || 0))
  const payableAmount = computed(() => Number((totalAmount.value + deliveryFee.value).toFixed(2)))
  /** 还差多少到起送价（0 表示已达标） */
  const minGap = computed(() => Math.max(0, Number((minPrice.value - totalAmount.value).toFixed(2))))
  const canSubmit = computed(() => !isEmpty.value && minGap.value <= 0)

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
        image: dish.imageUrl || dish.image || '',
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

  /** 切换店铺时清空购物车，避免把 A 店的菜下到 B 店 */
  function setShop(next) {
    const sameShop = shop.value && next && String(shop.value.id) === String(next.id)
    shop.value = next
      ? {
          id: String(next.id),
          name: next.name || '',
          deliveryFee: Number(next.deliveryFee || 0),
          minPrice: Number(next.minPrice || 0),
          deliveryTime: Number(next.deliveryTime || 0)
        }
      : null
    if (!sameShop) clear()
  }

  function setAddress(next) {
    address.value = next
      ? {
          id: String(next.id),
          tag: next.tag || '',
          name: next.name || '',
          phone: next.phone || '',
          detail: next.detail || ''
        }
      : null
  }

  /** 下单请求体：{ shopId, addressId, remark, items: [{dishId, quantity, flavors}] } */
  function toOrderPayload(remark = '') {
    return {
      shopId: shop.value?.id || '',
      addressId: address.value?.id || '',
      remark,
      items: items.value.map((x) => ({
        dishId: x.dishId,
        quantity: x.quantity,
        flavors: Object.entries(x.selection || {}).map(([name, value]) => ({ name, value }))
      }))
    }
  }

  watch(items, (val) => writeJson(CART_KEY, val), { deep: true })
  watch(shop, (val) => writeJson(SHOP_KEY, val), { deep: true })
  watch(address, (val) => writeJson(ADDR_KEY, val), { deep: true })

  return {
    items,
    shop,
    address,
    totalCount,
    totalAmount,
    isEmpty,
    deliveryFee,
    minPrice,
    payableAmount,
    minGap,
    canSubmit,
    add,
    inc,
    dec,
    remove,
    clear,
    setShop,
    setAddress,
    toOrderPayload
  }
})
