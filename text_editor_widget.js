(function (global) {
  "use strict";

  // ── Internal snapshot store (parallel to chatbot undoStack) ──────────────
  const _snaps = [];

  function _snap(type, data, label) {
    _snaps.push({ type, data, label, ts: Date.now() });
    if (_snaps.length > 30) _snaps.shift();
  }

  function _popSnap() {
    return _snaps.length ? _snaps.pop() : null;
  }

  function _resolve(selector) {
    if (!selector) return [];
    // Try as CSS selector first
    try {
      const nodes = Array.from(document.querySelectorAll(selector));
      if (nodes.length) return nodes;
    } catch (_) {}

    // Try fuzzy text match on common text-bearing elements
    const fuzzy = selector.toLowerCase();
    const candidates = Array.from(
      document.querySelectorAll(
        "h1,h2,h3,h4,h5,h6,.sec-head,.hero-title,.hero-sub,.kpi-label,.kpi-value,.kpi-sub,button,.btn,.tab-btn,.quick-btn,label,p,span,a,.chart-summary,.ac-title"
      )
    );
    return candidates.filter((el) => {
      const t = (el.textContent || "").toLowerCase().trim();
      return t.includes(fuzzy) || fuzzy.includes(t.slice(0, 20));
    });
  }

  // Map common Indonesian/English phrases to page selectors
  const TEXT_ALIAS = {
    // Page/section titles
    "judul halaman"   : ".hero-title",
    "page title"      : ".hero-title",
    "hero title"      : ".hero-title",
    "subtitle"        : ".hero-sub",
    "hero subtitle"   : ".hero-sub",
    "sub judul"       : ".hero-sub",
    "section title"   : ".sec-head",
    "judul section"   : ".sec-head",
    "judul grafik"    : ".sec-head",
    "chart title"     : ".sec-head",
    "chart label"     : ".sec-head",
    "kpi label"       : ".kpi-label",
    "kpi value"       : ".kpi-value",
    "kpi sub"         : ".kpi-sub",
    "tombol kirim"    : "#chatSend",
    "send button"     : "#chatSend",
    "search button"   : "button[type=submit]",
    "reset button"    : "button.btn.secondary",
    "input placeholder": "#chatInput",
    "chat placeholder": "#chatInput",
  };

  function _getCssSelector(alias) {
    const key = (alias || "").toLowerCase().trim();
    return TEXT_ALIAS[key] || null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  const TextEditor = {

    /**
     * Change text content of elements matching `target` selector or alias.
     * @param {string} target  - CSS selector, alias, or text-content fuzzy match
     * @param {string} newText - replacement text
     * @returns {{ changed: number, skipped: string[] }}
     */
    changeText(target, newText) {
      const cssTarget = _getCssSelector(target) || target;
      let nodes = _resolve(cssTarget);

      // Restrict to first match if fuzzy returned many
      if (nodes.length > 5) nodes = nodes.slice(0, 3);

      const oldValues = nodes.map((n) => ({
        el: n,
        old: n.textContent,
        hasHTML: n.innerHTML !== n.textContent,
      }));

      _snap("change_text", oldValues, `Teks diubah → "${newText}"`);

      nodes.forEach((el) => {
        // Preserve child elements (icons etc.) — only replace text nodes
        const textNodes = Array.from(el.childNodes).filter((n) => n.nodeType === 3);
        if (textNodes.length) {
          textNodes[0].textContent = newText;
          // Remove extra pure-text nodes if split somehow
          textNodes.slice(1).forEach((t) => t.remove());
        } else {
          el.textContent = newText;
        }
      });

      return { changed: nodes.length, skipped: nodes.length ? [] : [target] };
    },

    /**
     * Change a Plotly chart's title text.
     */
    changeChartTitle(chartId, newTitle) {
      const el = document.getElementById(chartId);
      if (!el) return false;

      const prevTitle = el._fullLayout?.title?.text || "";
      _snap("change_chart_title", { chartId, prevTitle }, `Judul chart → "${newTitle}"`);

      Plotly.relayout(chartId, { "title.text": newTitle });
      return true;
    },

    /**
     * Change font size — either a CSS variable (e.g. --txt) or a DOM selector.
     * size can be "14px", "1.2rem", "+2" (relative), "-2" (relative)
     */
    changeFontSize(target, size) {
      const root = document.documentElement;

      // CSS variable target
      if (target && target.startsWith("--")) {
        const prev = getComputedStyle(root).getPropertyValue(target).trim();
        _snap("change_font_size", [{ type: "cssvar", target, prev }], `Ukuran font ${target} → ${size}`);
        root.style.setProperty(target, size);
        return true;
      }

      // Global body font size
      if (["body", "semua", "all", "global", "seluruh"].includes((target || "").toLowerCase())) {
        const prev = document.body.style.fontSize || getComputedStyle(document.body).fontSize;
        _snap("change_font_size", [{ type: "body", prev }], `Ukuran font global → ${size}`);

        // Relative adjustment
        if (size.startsWith("+") || size.startsWith("-")) {
          const delta = parseFloat(size);
          const current = parseFloat(prev) || 14;
          document.body.style.fontSize = (current + delta) + "px";
        } else {
          document.body.style.fontSize = size;
        }
        return true;
      }

      // DOM elements
      const cssTarget = _getCssSelector(target) || target;
      const nodes = _resolve(cssTarget);
      if (!nodes.length) return false;

      const prevStyles = nodes.map((el) => ({ el, prev: el.style.fontSize }));
      _snap("change_font_size", prevStyles, `Ukuran font → ${size}`);

      nodes.forEach((el) => {
        if (size.startsWith("+") || size.startsWith("-")) {
          const delta = parseFloat(size);
          const current = parseFloat(getComputedStyle(el).fontSize) || 14;
          el.style.fontSize = (current + delta) + "px";
        } else {
          el.style.fontSize = size;
        }
      });
      return true;
    },

    /**
     * Change text color — CSS var or DOM selector.
     */
    changeTextColor(target, color) {
      const root = document.documentElement;

      // CSS variable (e.g. "--txt", "--txt2")
      if (target && target.startsWith("--")) {
        const prev = getComputedStyle(root).getPropertyValue(target).trim();
        _snap("change_text_color", [{ type: "cssvar", target, prev }], `Warna teks ${target} → ${color}`);
        root.style.setProperty(target, color);
        return true;
      }

      // Body/global
      if (["body", "semua", "all", "global"].includes((target || "").toLowerCase())) {
        const prev = document.body.style.color;
        _snap("change_text_color", [{ type: "body", prev }], `Warna teks global → ${color}`);
        document.body.style.color = color;
        return true;
      }

      const cssTarget = _getCssSelector(target) || target;
      const nodes = _resolve(cssTarget);
      if (!nodes.length) return false;

      const prevStyles = nodes.map((el) => ({ el, prev: el.style.color }));
      _snap("change_text_color", prevStyles, `Warna teks → ${color}`);
      nodes.forEach((el) => { el.style.color = color; });
      return true;
    },

    /**
     * Change placeholder of input/textarea.
     */
    changePlaceholder(target, newPlaceholder) {
      const cssTarget = _getCssSelector(target) || target;
      const nodes = _resolve(cssTarget).filter(
        (el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA"
      );

      // Also try by id if none found
      if (!nodes.length) {
        const direct = document.querySelector("textarea, input");
        if (direct) nodes.push(direct);
      }

      if (!nodes.length) return false;

      const prevValues = nodes.map((el) => ({ el, prev: el.placeholder }));
      _snap("change_placeholder", prevValues, `Placeholder → "${newPlaceholder}"`);
      nodes.forEach((el) => { el.placeholder = newPlaceholder; });
      return true;
    },

    /**
     * Change button label (text).
     */
    changeButtonText(target, newLabel) {
      // Try to find buttons by partial text match first
      let buttons = Array.from(document.querySelectorAll("button, .btn, .quick-btn, .tab-btn"))
        .filter((el) => {
          const t = el.textContent.toLowerCase().trim();
          return t.includes((target || "").toLowerCase());
        });

      if (!buttons.length) {
        const cssTarget = _getCssSelector(target) || target;
        buttons = _resolve(cssTarget).filter((el) => el.tagName === "BUTTON" || el.classList.contains("btn"));
      }

      if (!buttons.length) return false;

      const prevValues = buttons.map((el) => ({
        el,
        prev: el.innerHTML,
      }));
      _snap("change_button_text", prevValues, `Label tombol → "${newLabel}"`);

      buttons.forEach((el) => {
        // Preserve leading icons
        const icon = el.querySelector("i, svg");
        if (icon) {
          el.textContent = newLabel;
          el.prepend(icon);
        } else {
          el.textContent = newLabel;
        }
      });
      return true;
    },

    /**
     * Change element position/alignment.
     * position: "left" | "center" | "right" | "top" | "bottom" | CSS value
     */
    changeTextPosition(target, position) {
      const cssTarget = _getCssSelector(target) || target;
      const nodes = _resolve(cssTarget);
      if (!nodes.length) return false;

      const prevStyles = nodes.map((el) => ({
        el,
        prevAlign: el.style.textAlign,
        prevFloat: el.style.float,
        prevMargin: el.style.margin,
      }));
      _snap("change_position", prevStyles, `Posisi → ${position}`);

      const alignMap = {
        "kiri": "left", "kanan": "right", "tengah": "center",
        "left": "left", "center": "center", "right": "right",
        "rata kiri": "left", "rata kanan": "right", "rata tengah": "center",
      };
      const align = alignMap[(position || "").toLowerCase()];

      nodes.forEach((el) => {
        if (align) {
          el.style.textAlign = align;
        } else {
          el.style.cssText += ";" + position;
        }
      });
      return true;
    },

    /**
     * Execute a batch of text changes.
     * changes: Array<{ action, target, value, ... }>
     */
    batchTextChanges(changes) {
      const results = [];
      (changes || []).forEach((c) => {
        let ok = false;
        switch (c.action) {
          case "change_text":        ok = !!this.changeText(c.target, c.value); break;
          case "change_chart_title": ok = this.changeChartTitle(c.target, c.value); break;
          case "change_font_size":   ok = this.changeFontSize(c.target, c.value); break;
          case "change_text_color":  ok = this.changeTextColor(c.target, c.value); break;
          case "change_placeholder": ok = this.changePlaceholder(c.target, c.value); break;
          case "change_button_text": ok = this.changeButtonText(c.target, c.value); break;
          case "change_position":    ok = this.changeTextPosition(c.target, c.value); break;
        }
        results.push({ action: c.action, target: c.target, ok });
      });
      return results;
    },

    /**
     * Undo the last text manipulation from THIS module's stack.
     */
    undo() {
      const snap = _popSnap();
      if (!snap) return false;

      switch (snap.type) {
        case "change_text":
          (snap.data || []).forEach(({ el, old, hasHTML }) => {
            if (hasHTML) el.innerHTML = old;
            else el.textContent = old;
          });
          break;

        case "change_chart_title":
          if (snap.data?.chartId) {
            Plotly.relayout(snap.data.chartId, { "title.text": snap.data.prevTitle });
          }
          break;

        case "change_font_size":
        case "change_text_color":
          (snap.data || []).forEach((item) => {
            if (item.type === "cssvar") {
              document.documentElement.style.setProperty(item.target, item.prev);
            } else if (item.type === "body") {
              if (snap.type === "change_font_size") document.body.style.fontSize = item.prev;
              else document.body.style.color = item.prev;
            } else if (item.el) {
              if (snap.type === "change_font_size") item.el.style.fontSize = item.prev;
              else item.el.style.color = item.prev;
            }
          });
          break;

        case "change_placeholder":
          (snap.data || []).forEach(({ el, prev }) => { el.placeholder = prev; });
          break;

        case "change_button_text":
          (snap.data || []).forEach(({ el, prev }) => { el.innerHTML = prev; });
          break;

        case "change_position":
          (snap.data || []).forEach(({ el, prevAlign, prevFloat, prevMargin }) => {
            el.style.textAlign = prevAlign;
            el.style.float = prevFloat;
            el.style.margin = prevMargin;
          });
          break;
      }

      return snap.label;
    },

    /** Return last N snap labels (for debug) */
    history(n = 5) {
      return _snaps.slice(-n).map((s) => `[${s.type}] ${s.label}`);
    },
  };

  global.TextEditor = TextEditor;
})(window);