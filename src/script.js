// Get the root element (html)
const rootElement = document.documentElement;

// Toggle dark/light theme
function toggleTheme() {
  const currentBg = window.getComputedStyle(rootElement).getPropertyValue('--site-bg').trim();
  
  if (currentBg === '#000' || currentBg === 'rgb(0, 0, 0)') {
    // Switch to light mode
    rootElement.style.setProperty('--site-bg', '#fff');
    rootElement.style.setProperty('--site-color', '#000');
  } else {
    // Switch to dark mode
    rootElement.style.setProperty('--site-bg', '#000');
    rootElement.style.setProperty('--site-color', '#eee');
  }
}
