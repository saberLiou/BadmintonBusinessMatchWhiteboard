// 小型 SVG 圖示（函式元件）
import { h } from 'vue'

export const GripIcon = (props) =>
  h(
    'svg',
    {
      viewBox: '0 0 20 20',
      fill: 'currentColor',
      class: ['size-4', props.horizontal && 'rotate-90'],
    },
    [5, 10, 15].flatMap((y) => [7, 13].map((x) => h('circle', { cx: x, cy: y, r: 1.6 }))),
  )
GripIcon.props = ['horizontal']

/** 垃圾桶（刪除局、移除選手） */
export const TrashIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 20 20',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.6,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'size-4',
    },
    [
      h('path', { d: 'M3.5 5.5h13' }),
      h('path', { d: 'M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5' }),
      h('path', {
        d: 'M5 5.5l.8 10a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4l.8-10',
      }),
      h('path', { d: 'M8.5 9v5M11.5 9v5' }),
    ],
  )

export const CheckIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 20 20',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'size-5',
    },
    [h('path', { d: 'M4.5 10.5l3.5 3.5 7.5-8' })],
  )

/** 說明（圓圈 i） */
export const InfoIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 20 20',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      class: 'size-5',
    },
    [
      h('circle', { cx: 10, cy: 10, r: 7.5 }),
      h('path', { d: 'M10 9v5' }),
      h('circle', { cx: 10, cy: 6.25, r: 0.6, fill: 'currentColor' }),
    ],
  )

/** 刪除線（劃掉總分） */
export const StrikeIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 20 20',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      class: 'size-4',
    },
    [
      h('path', { d: 'M3.5 10h13' }),
      h('path', {
        d: 'M13.5 6.2C13 4.9 11.7 4 10 4 8 4 6.5 5.1 6.5 6.7c0 .9.4 1.6 1.2 2.1M7 13.6C7.5 15.1 8.8 16 10.3 16c2 0 3.5-1.1 3.5-2.8 0-.5-.1-1-.4-1.4',
      }),
    ],
  )
