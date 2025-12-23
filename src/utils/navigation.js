/**
 * 全局导航工具
 * 用于在非React组件中（如API拦截器）进行路由导航
 */

// 存储navigate函数的引用
let navigateFunc = null;

/**
 * 设置全局导航函数
 * 应该在App组件中调用
 * @param {Function} navigate - React Router的navigate函数
 */
export const setNavigate = (navigate) => {
  navigateFunc = navigate;
};

/**
 * 获取全局导航函数
 * @returns {Function|null} navigate函数或null
 */
export const getNavigate = () => {
  return navigateFunc;
};

/**
 * 导航到指定路径
 * @param {string} path - 目标路径
 * @param {object} options - 导航选项，如 { replace: true }
 */
export const navigateTo = (path, options = {}) => {
  if (navigateFunc) {
    navigateFunc(path, options);
    return true;
  } else {
    console.warn('Navigate function not initialized. Falling back to window.location.');
    if (options.replace) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
    return false;
  }
};

