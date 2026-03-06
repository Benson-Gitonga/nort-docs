"use strict";

/* ====== Define JS Constants ====== */
const sidebarToggler = document.getElementById('docs-sidebar-toggler');
const sidebar        = document.getElementById('docs-sidebar');
const sidebarLinks   = document.querySelectorAll('#docs-sidebar .scrollto');

/* ===== Responsive Sidebar ====== */
window.onload  = function() { responsiveSidebar(); };
window.onresize = function() { responsiveSidebar(); };

function responsiveSidebar() {
    let w = window.innerWidth;
    if (w >= 1200) {
        sidebar.classList.remove('sidebar-hidden');
        sidebar.classList.add('sidebar-visible');
    } else {
        sidebar.classList.remove('sidebar-visible');
        sidebar.classList.add('sidebar-hidden');
    }
}

sidebarToggler.addEventListener('click', () => {
    if (sidebar.classList.contains('sidebar-visible')) {
        sidebar.classList.remove('sidebar-visible');
        sidebar.classList.add('sidebar-hidden');
    } else {
        sidebar.classList.remove('sidebar-hidden');
        sidebar.classList.add('sidebar-visible');
    }
});

/* ===== Smooth scrolling ====== */
sidebarLinks.forEach((sidebarLink) => {
    sidebarLink.addEventListener('click', (e) => {
        e.preventDefault();
        var target = sidebarLink.getAttribute("href").replace('#', '');
        document.getElementById(target).scrollIntoView({ behavior: 'smooth' });
        if (sidebar.classList.contains('sidebar-visible') && window.innerWidth < 1200) {
            sidebar.classList.remove('sidebar-visible');
            sidebar.classList.add('sidebar-hidden');
        }
    });
});

/* ===== Gumshoe ScrollSpy ===== */
var spy = new Gumshoe('#docs-nav a', { offset: 69 });

/* ====== SimpleLightbox ======= */
var lightbox = new SimpleLightbox('.simplelightbox-gallery a', {});

/* ===================================================
   SEARCH — client-side full-text search
   Scans every heading, paragraph, li, td, th in
   .docs-content, highlights matches, shows a floating
   results panel, scrolls to the first hit.
   =================================================== */
(function () {

    // ── build the results panel once ──────────────────
    const panel = document.createElement('div');
    panel.id = 'nort-search-panel';
    panel.style.cssText = [
        'display:none',
        'position:fixed',
        'top:70px',
        'right:24px',
        'width:340px',
        'max-height:480px',
        'overflow-y:auto',
        'z-index:9999',
        'background:rgba(10,22,40,0.97)',
        'border:1px solid rgba(45,212,191,0.35)',
        'border-radius:12px',
        'box-shadow:0 8px 48px rgba(0,0,0,0.6)',
        'padding:16px',
        'backdrop-filter:blur(24px)'
    ].join(';');
    document.body.appendChild(panel);

    // close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !e.target.closest('.search-form')) {
            closePanel();
        }
    });

    function closePanel() {
        panel.style.display = 'none';
        clearHighlights();
    }

    // ── highlight helpers ──────────────────────────────
    function highlightNode(node, regex) {
        if (node.nodeType === 3) { // text node
            const text = node.nodeValue;
            if (!regex.test(text)) return null;
            regex.lastIndex = 0;
            const frag = document.createDocumentFragment();
            let last = 0, m;
            while ((m = regex.exec(text)) !== null) {
                frag.appendChild(document.createTextNode(text.slice(last, m.index)));
                const mark = document.createElement('mark');
                mark.className = 'nort-highlight';
                mark.style.cssText = 'background:rgba(45,212,191,0.35);color:#fff;border-radius:3px;padding:0 2px';
                mark.textContent = m[0];
                frag.appendChild(mark);
                last = m.index + m[0].length;
            }
            frag.appendChild(document.createTextNode(text.slice(last)));
            node.parentNode.replaceChild(frag, node);
            return true;
        }
        return null;
    }

    function walkAndHighlight(el, regex) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        const nodes = [];
        let n;
        while ((n = walker.nextNode())) nodes.push(n);
        nodes.forEach(n => highlightNode(n, regex));
    }

    function clearHighlights() {
        document.querySelectorAll('mark.nort-highlight').forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    }

    // ── search core ────────────────────────────────────
    function runSearch(query) {
        clearHighlights();
        panel.style.display = 'none';
        if (!query || query.trim().length < 2) return;

        const terms = query.trim().split(/\s+/).filter(Boolean);
        // regex that matches any of the terms
        const regex = new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');

        const content = document.querySelector('.docs-content');
        if (!content) return;

        // collect searchable elements
        const els = content.querySelectorAll('h1,h2,h3,h4,h5,p,li,td,th');
        const hits = [];

        els.forEach(el => {
            const text = el.textContent || '';
            regex.lastIndex = 0;
            if (regex.test(text)) {
                // find the nearest section anchor
                const section = el.closest('[id]');
                const id = section ? section.id : null;
                const snippet = text.length > 120 ? text.slice(0, 120) + '…' : text;
                hits.push({ el, id, snippet, text });
            }
        });

        // highlight all matches in the content area
        regex.lastIndex = 0;
        walkAndHighlight(content, new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi'));

        // ── build the panel UI ──
        panel.innerHTML = '';

        // header row
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px';
        const title = document.createElement('span');
        title.style.cssText = 'font-family:"DM Mono",monospace;font-size:10px;letter-spacing:0.6px;text-transform:uppercase;color:#2DD4BF';
        title.textContent = hits.length > 0
            ? hits.length + ' result' + (hits.length !== 1 ? 's' : '') + ' for "' + query + '"'
            : 'No results for "' + query + '"';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;font-size:14px;padding:0';
        closeBtn.addEventListener('click', closePanel);
        header.appendChild(title);
        header.appendChild(closeBtn);
        panel.appendChild(header);

        if (hits.length === 0) {
            const empty = document.createElement('p');
            empty.style.cssText = 'color:rgba(255,255,255,0.5);font-size:13px;margin:8px 0 0';
            empty.textContent = 'Try a different search term.';
            panel.appendChild(empty);
        } else {
            // deduplicate by section id, show max 12 results
            const seen = new Set();
            const unique = hits.filter(h => {
                const key = h.id || h.snippet.slice(0, 40);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            }).slice(0, 12);

            unique.forEach((hit, i) => {
                const item = document.createElement('div');
                item.style.cssText = [
                    'padding:10px 12px',
                    'margin-bottom:6px',
                    'border-radius:8px',
                    'background:rgba(255,255,255,0.04)',
                    'border:1px solid rgba(255,255,255,0.07)',
                    'cursor:pointer',
                    'transition:border-color 0.15s'
                ].join(';');
                item.addEventListener('mouseenter', () => item.style.borderColor = 'rgba(45,212,191,0.4)');
                item.addEventListener('mouseleave', () => item.style.borderColor = 'rgba(255,255,255,0.07)');

                const snippetEl = document.createElement('p');
                snippetEl.style.cssText = 'margin:0;font-size:12px;color:rgba(255,255,255,0.75);line-height:1.5';
                // bold the matched terms in the snippet
                snippetEl.innerHTML = hit.snippet.replace(
                    new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi'),
                    '<strong style="color:#2DD4BF">$1</strong>'
                );

                item.appendChild(snippetEl);
                item.addEventListener('click', () => {
                    hit.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    closePanel();
                    // re-highlight just this element briefly
                    hit.el.style.transition = 'background 0.3s';
                    hit.el.style.background = 'rgba(45,212,191,0.08)';
                    setTimeout(() => { hit.el.style.background = ''; }, 1800);
                });
                panel.appendChild(item);
            });
        }

        panel.style.display = 'block';

        // scroll to first hit
        if (hits.length > 0) {
            hits[0].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // ── wire up both search forms (header + sidebar) ──
    document.querySelectorAll('.search-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('.search-input');
            if (input) runSearch(input.value);
        });
        const input = form.querySelector('.search-input');
        if (input) {
            // also trigger on Enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    runSearch(input.value);
                }
            });
            // clear search when input is emptied
            input.addEventListener('input', () => {
                if (input.value.trim() === '') clearHighlights();
            });
        }
    });

})(); // end search IIFE
