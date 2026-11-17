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

export const RemoveIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 20 20',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      class: 'size-4',
    },
    [h('path', { d: 'M5 5l10 10M15 5L5 15' })],
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

export const PencilIcon = () =>
  h('svg', { viewBox: '0 0 20 20', fill: 'currentColor', class: 'size-4' }, [
    h('path', {
      d: 'M13.59 3.59a2 2 0 0 1 2.82 2.82l-.79.8-2.83-2.83.8-.79ZM11.73 5.44 3.5 13.67V16.5h2.83l8.23-8.23-2.83-2.83Z',
    }),
  ])

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
