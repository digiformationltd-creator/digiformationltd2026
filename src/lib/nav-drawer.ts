let count = 0;

/**
 * Tracks how many nav drawers are currently open.
 * Toggles the `nav-drawer-open` class on <body> when count > 0.
 * Use this so floating buttons (WhatsApp, AI) can hide while menus are open.
 */
export function setNavDrawerOpen(open: boolean) {
  if (open) count++;
  else count = Math.max(0, count - 1);
  document.body.classList.toggle("nav-drawer-open", count > 0);
}
