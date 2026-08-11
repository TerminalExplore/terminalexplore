function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMd(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let list: string[] = [];

  function flushList() {
    if (list.length) {
      html.push(`<ul>${list.join("")}</ul>`);
      list = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      html.push(`<h3>${inlineMd(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      html.push(`<h2>${inlineMd(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      list.push(`<li>${inlineMd(trimmed.slice(2))}</li>`);
      continue;
    }

    flushList();
    html.push(`<p>${inlineMd(trimmed)}</p>`);
  }

  flushList();
  return html.join("");
}
