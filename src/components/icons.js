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
