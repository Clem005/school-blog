/**
 * CLEMENT | Creative Technologist
 * Master 3D Engine: Offline JSON-File Architecture
 */

// 1. THE MANIFEST
// Add every filename you create in the /posts/ folder here.
const POST_FILES = [
    "week1.json",
    "week2.json",
    "week3.json",
    "week4.json",
    "week5.json",
    "week6.json",
    "week7.json",
    "week8.json",
    "week9.json",
    "week10.json",
    "week11.json"
    
];

let globalPosts = [];

/**
 * YouTube ID Extractor
 */
function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "dQw4w9WgXcQ";
}

/**
 * INITIALIZATION
 */
async function init() {
    console.log("System: Booting Archive...");

    const feed = document.getElementById('blog-feed');
    const scrollTrack = document.querySelector('.scroll-track');

    try {
        const loadPromises = POST_FILES.map(async (file) => {
            const response = await fetch(`./posts/${file}`);
            if (!response.ok) throw new Error(`File not found: ${file}`);
            return await response.json();
        });

        globalPosts = await Promise.all(loadPromises);
        console.log("System: Data successfully decoded.", globalPosts);

        renderArticles(globalPosts);

        const totalHeight = (globalPosts.length * 140) + 250;
        scrollTrack.style.height = `${totalHeight}vh`;

        init3DScroll();
        initModalLogic();

    } catch (err) {
        console.error("FATAL ERROR:", err.message);
        feed.innerHTML = `<p style="color:white; text-align:center; padding:100px; font-family:serif;">
            [ ERROR: ARCHIVE ACCESS DENIED ] <br><br>
            Ensure you are using VS Code 'Live Server' and that your JSON files exist in the /posts/ folder.
        </p>`;
    }
}

/**
 * RENDER ARTICLE CARDS
 */
function renderArticles(posts) {
    const feed = document.getElementById('blog-feed');

    feed.innerHTML = posts.map((post, i) => {
        const videoId = getYouTubeID(post.videoUrl);
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        const preview = getTextPreview(post, 110);

        return `
            <div class="blog-card" data-index="${i}">
                <img src="${thumbUrl}" alt="thumbnail">
                <div class="card-info">
                    <span class="index-number">${post.category} // ENTRY ${i + 1}</span>
                    <h3>${post.title}</h3>
                    <p>${preview}...</p>
                    <div style="margin-top:20px; font-size: 0.6rem; letter-spacing: 2px; color: #666;">DECODE ARCHIVE +</div>
                </div>
            </div>
        `;
    }).join('');

    feed.onclick = (e) => {
        const card = e.target.closest('.blog-card');
        if (card) openArticle(globalPosts[card.getAttribute('data-index')]);
    };
}

/**
 * Plain-text preview for card (strips newlines for clean display)
 */
function getTextPreview(post, length) {
    if (post.paragraphs && post.paragraphs.length > 0) {
        const first = post.paragraphs[0];
        const text = typeof first === 'string' ? first : (first.text || '');
        return text.replace(/\n/g, ' ').substring(0, length);
    }
    return String(post.content || '').replace(/\n/g, ' ').substring(0, length);
}

/**
 * BUILD RICH ARTICLE BODY
 * ─────────────────────────────────────────────────────────
 * FORMAT A — flat "content" string.
 *   Use \n\n to separate paragraphs in your JSON value.
 *   Use \n for a line break inside a paragraph.
 *
 *   Example JSON:
 *   {
 *     "content": "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
 *   }
 *
 * FORMAT B — "paragraphs" array (text + local images mixed).
 *
 *   {
 *     "paragraphs": [
 *       { "type": "text",    "text": "Opening paragraph..." },
 *       { "type": "image",   "src": "./images/photo.jpg", "caption": "Caption text", "position": "center" },
 *       { "type": "text",    "text": "More text...\n\nAnother paragraph in the same block." },
 *       { "type": "image",   "src": "./images/side.jpg",  "caption": "Side note",    "position": "left" },
 *       { "type": "quote",   "text": "A pull quote." },
 *       { "type": "heading", "text": "New Section Title" }
 *     ]
 *   }
 *
 *   Image positions: "center" | "left" | "right"
 *   Images are loaded from your local /images/ folder — no internet needed.
 * ─────────────────────────────────────────────────────────
 */
function buildArticleBody(post) {

    // ── FORMAT B: paragraphs array ──
    if (post.paragraphs && Array.isArray(post.paragraphs)) {
        return post.paragraphs.map(block => {

            if (typeof block === 'string') {
                return splitIntoParagraphs(block);
            }

            switch (block.type) {
                case 'text':
                case undefined:
                    return splitIntoParagraphs(block.text || '');

                case 'image':
                    return buildImageFigure(block);

                case 'quote':
                    return `<blockquote class="article-quote">${escapeHtml(block.text || '')}</blockquote>`;

                case 'heading':
                    return `<h2 class="article-subheading">${escapeHtml(block.text || '')}</h2>`;

                default:
                    return '';
            }

        }).join('');
    }

    // ── FORMAT A: flat content string, split on \n\n ──
    return splitIntoParagraphs(post.content || '');
}

/**
 * Split raw text on \n\n into <p> tags.
 * Single \n inside a chunk becomes <br>.
 */
function splitIntoParagraphs(rawText) {
    if (!rawText.trim()) return '';

    return rawText
        .split(/\n\n+/)
        .map(chunk => chunk.trim())
        .filter(chunk => chunk.length > 0)
        .map(chunk => {
            const inner = chunk
                .split(/\n/)
                .map(line => escapeHtml(line))
                .join('<br>');
            return `<p class="article-paragraph">${inner}</p>`;
        })
        .join('');
}

/**
 * Build <figure> for a local image.
 * src is relative: use "./images/filename.jpg" in your JSON.
 */
function buildImageFigure(block) {
    const pos     = block.position || 'center';
    const src     = block.src || '';
    const caption = block.caption || '';

    return `
        <figure class="article-figure article-figure--${pos}">
            <img src="${src}" alt="${escapeHtml(caption)}" loading="lazy">
            ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
        </figure>
    `;
}

/**
 * Minimal HTML escaper — prevents raw JSON content from injecting HTML
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * OPEN ARTICLE MODAL
 */
function openArticle(post) {
    const modal          = document.getElementById('article-modal');
    const bodyEl         = document.getElementById('modal-body');
    const mediaContainer = document.getElementById('modal-media-container');

    const videoId = getYouTubeID(post.videoUrl);

    document.getElementById('modal-title').innerText    = post.title;
    document.getElementById('modal-category').innerText = post.category;

    mediaContainer.innerHTML = `
        <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;

    bodyEl.innerHTML = buildArticleBody(post);

    // Staggered fade-in for each block
    const blocks = bodyEl.querySelectorAll(
        '.article-paragraph, .article-figure, .article-quote, .article-subheading'
    );
    blocks.forEach((el, i) => {
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(16px)';
        el.style.transition = `opacity 0.45s ease ${i * 0.07}s, transform 0.45s ease ${i * 0.07}s`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.opacity   = '1';
            el.style.transform = 'translateY(0)';
        }));
    });

    modal.style.display          = 'flex';
    document.body.style.overflow = 'hidden';
    modal.scrollTop              = 0;
}

/**
 * CLOSE MODAL
 */
function closeModal() {
    const modal = document.getElementById('article-modal');
    modal.style.display = 'none';
    document.getElementById('modal-media-container').innerHTML = '';
    document.body.style.overflow = 'auto';
}

/**
 * 3D SCROLL ENGINE
 */
function init3DScroll() {
    const cards = document.querySelectorAll('.blog-card');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const vh       = window.innerHeight;

        cards.forEach((card, i) => {
            const spacing   = vh * 1.3;
            const cardStart = (vh * 1.5) + (i * spacing);
            const progress  = (scrolled - cardStart) / vh;

            const z       = (progress * 2800) - 800;
            const opacity = 1 - (progress * 1.3);
            const rotateY = progress * 25;
            const xDrift  = Math.sin(progress * 2) * 40;

            if (z > -2500 && z < 2000) {
                card.style.display   = 'flex';
                card.style.opacity   = opacity > 0 ? opacity : 0;
                card.style.transform = `translate3d(${xDrift}px, 0, ${z}px) rotateY(${rotateY}deg)`;
                const blurValue      = Math.abs(progress) > 0.6 ? (Math.abs(progress) * 8) : 0;
                card.style.filter    = `blur(${blurValue}px)`;
            } else {
                card.style.display = 'none';
            }
        });
    });
}

/**
 * MODAL UTILITIES
 */
function initModalLogic() {
    const modal    = document.getElementById('article-modal');
    const closeBtn = document.getElementById('close-btn');

    closeBtn.onclick = closeModal;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// BOOT
window.onload = init;
