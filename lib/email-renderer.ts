/**
 * Gmail-style email HTML renderer.
 *
 * Gmail's approach:
 * 1. Parse and extract all <style> blocks
 * 2. Inline CSS onto elements (eliminates style leakage)
 * 3. Prefix remaining CSS selectors with a unique scoped class
 * 4. Strip dangerous tags: script, form, object, embed, meta, link, base
 * 5. Strip dangerous attributes: onclick, onerror, onload, etc.
 * 6. Rewrite external image URLs through a proxy (optional)
 * 7. Add target="_blank" rel="noopener" to all links
 * 8. Render in a <div> with scoped class (no iframe needed)
 */

import DOMPurify from "dompurify"

// Generate a unique scope ID for CSS isolation
let scopeCounter = 0
function generateScopeId(): string {
  return `gx-email-${++scopeCounter}-${Date.now().toString(36)}`
}

// Dangerous tags that Gmail strips
const STRIP_TAGS = [
  "script",
  "form",
  "object",
  "embed",
  "applet",
  "meta",
  "link",
  "base",
  "iframe",
  "frame",
  "frameset",
]

// Dangerous attributes Gmail strips
const STRIP_ATTRS = [
  "onclick",
  "ondblclick",
  "onmousedown",
  "onmouseup",
  "onmouseover",
  "onmousemove",
  "onmouseout",
  "onkeypress",
  "onkeydown",
  "onkeyup",
  "onload",
  "onerror",
  "onabort",
  "onfocus",
  "onblur",
  "onchange",
  "onsubmit",
  "onreset",
  "onselect",
  "onunload",
  "onbeforeunload",
  "formaction",
  "xlink:href",
]

/**
 * Extract <style> blocks from HTML and return them separately
 */
function extractStyles(html: string): { html: string; styles: string[] } {
  const styles: string[] = []
  const cleaned = html.replace(
    /<style[^>]*>([\s\S]*?)<\/style>/gi,
    (_, css) => {
      styles.push(css)
      return ""
    }
  )
  return { html: cleaned, styles }
}

/**
 * Prefix all CSS selectors with a scope class.
 * This prevents email styles from leaking into the app.
 * Gmail does this with a unique class prefix like ".a3s"
 */
function scopeCSS(css: string, scopeClass: string): string {
  // Remove @import rules (security risk)
  let scoped = css.replace(/@import[^;]+;/gi, "")

  // Remove @charset
  scoped = scoped.replace(/@charset[^;]+;/gi, "")

  // Handle @media queries — scope selectors inside them
  scoped = scoped.replace(
    /@media([^{]+)\{([\s\S]*?)\}\s*\}/gi,
    (_, query, rules) => {
      const scopedRules = scopeSelectors(rules, scopeClass)
      return `@media${query}{${scopedRules}}`
    }
  )

  // Scope remaining top-level selectors
  scoped = scopeSelectors(scoped, scopeClass)

  return scoped
}

function scopeSelectors(css: string, scopeClass: string): string {
  // Match selector blocks: selectors { properties }
  return css.replace(
    /([^{}@]+)\{([^{}]*)\}/g,
    (_, selectors: string, properties: string) => {
      const scopedSelectors = selectors
        .split(",")
        .map((sel: string) => {
          sel = sel.trim()
          if (!sel || sel.startsWith("@")) return sel

          // Don't scope body/html — replace with the scope class
          if (sel === "body" || sel === "html") {
            return `.${scopeClass}`
          }

          // Prefix with scope class
          return `.${scopeClass} ${sel}`
        })
        .join(", ")

      return `${scopedSelectors} { ${properties} }`
    }
  )
}

/**
 * Rewrite links to open in new tab (Gmail behavior)
 */
function rewriteLinks(html: string): string {
  // Add target="_blank" and rel="noopener noreferrer" to all <a> tags
  return html.replace(
    /<a\s/gi,
    '<a target="_blank" rel="noopener noreferrer" '
  )
}

/**
 * Main render function — processes email HTML like Gmail does.
 * Returns { scopeId, html, css } ready to render in a scoped <div>.
 */
export function renderEmailHTML(rawHtml: string): {
  scopeId: string
  html: string
  css: string
} {
  if (!rawHtml) {
    return { scopeId: "", html: "", css: "" }
  }

  const scopeId = generateScopeId()

  // Step 1: Extract <style> blocks
  const { html: htmlWithoutStyles, styles } = extractStyles(rawHtml)

  // Step 2: Sanitize HTML with DOMPurify
  const sanitized = DOMPurify.sanitize(htmlWithoutStyles, {
    FORBID_TAGS: STRIP_TAGS,
    FORBID_ATTR: STRIP_ATTRS,
    ADD_ATTR: ["target", "rel"],
    // Allow data: URIs for inline images (common in emails)
    ALLOW_DATA_ATTR: false,
    ADD_URI_SAFE_ATTR: ["src"],
  })

  // Step 3: Rewrite links to open in new tab
  const withLinks = rewriteLinks(sanitized)

  // Step 4: Scope extracted CSS
  const scopedCSS = styles
    .map((css) => scopeCSS(css, scopeId))
    .join("\n")

  // Step 5: Re-add browser default styles scoped to email container.
  // Tailwind's preflight strips ALL default styles (margins, heading sizes,
  // list bullets, table borders, etc.). We restore them here — this is
  // exactly what Gmail does inside its .a3s scoped container.
  const S = scopeId
  const baseCSS = `
    .${S} {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #2d1a0e;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .${S} * { box-sizing: border-box; }

    /* Restore heading styles */
    .${S} h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
    .${S} h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
    .${S} h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
    .${S} h4 { font-size: 1em; font-weight: bold; margin: 1.33em 0; }
    .${S} h5 { font-size: 0.83em; font-weight: bold; margin: 1.67em 0; }
    .${S} h6 { font-size: 0.67em; font-weight: bold; margin: 2.33em 0; }

    /* Restore paragraph/block styles */
    .${S} p { margin: 1em 0; }
    .${S} br { display: block; }
    .${S} hr { border: none; border-top: 1px solid #e8ddf0; margin: 1em 0; }

    /* Restore list styles */
    .${S} ul { list-style-type: disc; padding-left: 2em; margin: 1em 0; }
    .${S} ol { list-style-type: decimal; padding-left: 2em; margin: 1em 0; }
    .${S} li { display: list-item; margin: 0.25em 0; }
    .${S} ul ul { list-style-type: circle; }
    .${S} ul ul ul { list-style-type: square; }

    /* Restore table styles */
    .${S} table { border-collapse: collapse; max-width: 100% !important; }
    .${S} td, .${S} th { padding: 4px 8px; vertical-align: top; }
    .${S} th { font-weight: bold; text-align: left; }

    /* Restore inline styles */
    .${S} strong, .${S} b { font-weight: bold; }
    .${S} em, .${S} i { font-style: italic; }
    .${S} u { text-decoration: underline; }
    .${S} s, .${S} strike, .${S} del { text-decoration: line-through; }
    .${S} small { font-size: 0.83em; }
    .${S} sub { font-size: 0.75em; vertical-align: sub; }
    .${S} sup { font-size: 0.75em; vertical-align: super; }
    .${S} code { font-family: monospace; font-size: 0.9em; background: #f5e5fc; padding: 0.15em 0.3em; border-radius: 3px; }
    .${S} pre { font-family: monospace; white-space: pre-wrap; overflow-x: auto; margin: 1em 0; padding: 0.5em; background: #faf5fd; border-radius: 4px; }

    /* Restore link styles */
    .${S} a { color: #48b8d0; text-decoration: underline; }
    .${S} a:hover { opacity: 0.8; }

    /* Restore image styles */
    .${S} img { max-width: 100%; height: auto; border: 0; }

    /* Restore blockquote (email replies) */
    .${S} blockquote {
      border-left: 3px solid #e8ddf0;
      padding-left: 12px;
      margin: 1em 0 1em 0;
      color: #b28b84;
    }

    /* Restore definition lists */
    .${S} dl { margin: 1em 0; }
    .${S} dt { font-weight: bold; }
    .${S} dd { margin-left: 2em; }

    /* Restore address/cite */
    .${S} address { font-style: italic; }
    .${S} cite { font-style: italic; }

    /* Restore figure */
    .${S} figure { margin: 1em 2em; }
    .${S} figcaption { font-size: 0.9em; color: #b28b84; }

    /* Ensure divs and spans don't collapse */
    .${S} div { display: block; }
    .${S} span { display: inline; }
    .${S} center { text-align: center; display: block; }
  `

  return {
    scopeId,
    html: withLinks,
    css: baseCSS + "\n" + scopedCSS,
  }
}
