/**
 * Парсинг информации о браузере из User-Agent
 */

export function getBrowserInfo(): string {
  if (typeof navigator === 'undefined') {
    return 'Unknown Browser';
  }

  const userAgent = navigator.userAgent;

  // Парсим браузер и версию
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  // Chrome
  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Chromium') === -1) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    if (match) browserVersion = match[1].split('.')[0]; // только мажор версия
  }
  // Safari
  else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    if (match) browserVersion = match[1].split('.')[0];
  }
  // Firefox
  else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    if (match) browserVersion = match[1].split('.')[0];
  }
  // Edge
  else if (userAgent.indexOf('Edg') > -1) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    if (match) browserVersion = match[1].split('.')[0];
  }

  // Парсим ОС
  let osName = 'Unknown OS';

  if (userAgent.indexOf('Windows') > -1) {
    osName = 'Windows';
  } else if (userAgent.indexOf('Mac') > -1) {
    osName = 'macOS';
  } else if (userAgent.indexOf('Linux') > -1) {
    osName = 'Linux';
  } else if (userAgent.indexOf('iPad') > -1) {
    osName = 'iPad OS';
  } else if (userAgent.indexOf('iPhone') > -1) {
    osName = 'iOS';
  } else if (userAgent.indexOf('Android') > -1) {
    osName = 'Android';
  }

  return `${browserName} ${browserVersion} / ${osName}`;
}
