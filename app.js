const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#navigation');

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  navigation.classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

const highlightTimers = new Map();
function highlightCard(card) {
  card.classList.add('is-highlighted');
  window.clearTimeout(highlightTimers.get(card));
  highlightTimers.set(card, window.setTimeout(() => {
    card.classList.remove('is-highlighted');
    highlightTimers.delete(card);
  }, 2800));
}
document.querySelectorAll('.timeline-node').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', link.getAttribute('href'));
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    highlightCard(target);
  });
});
// Native links keep the page usable with JavaScript disabled and support browser history.
window.addEventListener('hashchange', () => {
  const card = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (card?.classList.contains('experience-card')) highlightCard(card);
});

// Clipboard writes only occur after an explicit click on a contact's copy button.
const copyStatus = document.querySelector('.copy-status');
const fallbackPanel = document.querySelector('.copy-fallback');
const fallbackValue = document.querySelector('#copy-value');
let fallbackTrigger;
const copyResetTimers = new WeakMap();
async function copyContactValue(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try { await navigator.clipboard.writeText(value); return; } catch { /* Try the older browser path below. */ }
  }
  const active = document.activeElement;
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
  document.body.append(field);
  try {
    field.focus();
    field.select();
    field.setSelectionRange(0, value.length);
    if (!document.execCommand('copy')) throw new Error('Copy unavailable');
  } finally {
    field.remove();
    active?.focus({ preventScroll: true });
  }
}
document.querySelectorAll('.copy-contact').forEach(button => {
  button.addEventListener('click', async () => {
    if (button.getAttribute('aria-busy') === 'true') return;
    window.clearTimeout(copyResetTimers.get(button));
    button.setAttribute('aria-busy', 'true');
    try {
      await copyContactValue(button.dataset.copy);
      fallbackPanel.hidden = true;
      button.classList.add('is-copied');
      button.querySelector('span').textContent = 'Скопировано';
      copyStatus.textContent = `Скопировано: ${button.dataset.contact}`;
      copyResetTimers.set(button, window.setTimeout(() => {
        button.classList.remove('is-copied');
        button.querySelector('span').textContent = 'Скопировать';
      }, 2500));
    } catch {
      button.classList.remove('is-copied');
      button.querySelector('span').textContent = 'Скопировать';
      copyStatus.textContent = 'Автоматическое копирование недоступно в этом браузере';
      fallbackTrigger = button;
      fallbackPanel.hidden = false;
      fallbackValue.value = button.dataset.copy;
      fallbackValue.focus();
      fallbackValue.select();
    } finally {
      button.setAttribute('aria-busy', 'false');
    }
  });
});
document.querySelector('.copy-fallback-close').addEventListener('click', () => {
  fallbackPanel.hidden = true;
  copyStatus.textContent = '';
  fallbackTrigger?.focus();
});
