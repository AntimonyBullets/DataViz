// Chart.js CDN loader
export function loadChartJs(callback) {
  if (window.Chart) {
    callback && callback()
    return
  }
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js'
  script.onload = () => callback && callback()
  document.head.appendChild(script)
}
