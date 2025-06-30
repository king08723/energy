/**
 * 格式化设备运行时间
 * 将"XX小时XX分钟"格式转换为"XXhXXm"格式
 * @param {string} uptime 运行时间字符串，格式为"XX小时XX分钟"
 * @returns {string} 格式化后的运行时间字符串，格式为"XXhXXm"
 */
function formatUptime(uptime) {
  if (!uptime) return '0h0m';

  // 提取小时和分钟数值
  const hourMatch = uptime.match(/(\d+)小时/);
  const minuteMatch = uptime.match(/(\d+)分钟/);

  const hours = hourMatch ? hourMatch[1] : '0';
  const minutes = minuteMatch ? minuteMatch[1] : '0';

  return `${hours}h${minutes}m`;
}

module.exports = { formatUptime };