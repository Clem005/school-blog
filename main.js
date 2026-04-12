/**
 * CLEMENT | Creative Technologist
 * Master 3D Engine: Offline JSON-File Architecture
 */

let globalPosts = [];

/**
 * YouTube ID Extractor
 * Converts any YT link into a clean ID
 */
function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "dQw4w9WgXcQ";
}

/**
 * INITIALIZATION
 * Reads manifest.json from /posts/ folder, then loads all JSON files listed in it
 */
async function init() {
    console.log("System: Booting Archive...");

    const feed = document.getElementById('blog-feed');
    const scrollTrack = document.querySelector('.scroll-track');

    try {
        // Step 1: Load the manifest to get the list of post filenames
        const manifestResponse = await fetch('./posts/manifest.json');
        if (!manifestResponse.ok) throw new Error('manifest.json not found in /posts/ folder');
        const fileList = await manifestResponse.json();

        console.log("System: Manifest loaded.", fileList);

        // Step 2: Load every JSON file listed in the manifest
        const loadPromises = fileList.map(async (file) => {
            const response = await fetch(`./posts/${file}`);
            if (!response.ok) throw new Error(`File not found: ${file}`);
            return await response.json();
        });

        globalPosts = await Promise.all(loadPromises);
        console.log("System: Data successfully decoded.", globalPosts);

        // 1. RENDER CARDS
        renderArticles(globalPosts);

        // 2. CALCULATE RUNWAY
        const totalHeight = (globalPosts.length * 140) + 250;
        scrollTrack.style.height = `${totalHeight}vh`;

        // 3. START ENGINES
        init3DScroll();
        initModalLogic();

    } catch (err) {
        console.error("FATAL ERROR:", err.message);
        feed.innerHTML = `<p style="color:white; text-align:center; padding:100px; font-family:serif;">
            [ ERROR: ARCHIVE ACCESS DENIED ] <br><br>
            ${err.message}
        </p>`;
    }
}

/**
 * RENDER ARTICLES
 */
function renderArticles(posts) {
    const feed = document.getElementById('blog-feed');

    feed.innerHTML = posts.map((post, i) => {
        const videoId = getYouTubeID(post.videoUrl);
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        return `
            <div class="blog-card" data-index="${i}">
                <img src="${thumbUrl}" alt="thumbnail">
                <div class="card-info">
                    <span class="index-number">${post.category} // ENTRY ${i + 1}</span>
                    <h3>${post.title}</h3>
                    <p>${post.content.substring(0, 95)}...</p>
                    <div style="margin-top:20px; font-size: 0.6rem; letter-spacing: 2px; color: #666;">DECODE ARCHIVE +</div>
                </div>
            </div>
        `;
    }).join('');

    // Attach click events
    feed.onclick = (e) => {
        const card = e.target.closest('.blog-card');
        if (card) {
            const index = card.getAttribute('data-index');
            openArticle(globalPosts[index]);
        }
    };
}

/**
 * 3D SCROLL ENGINE
 * Makes cards fly from distance (-800px) to past screen (2000px)
 */
function init3DScroll() {
    const cards = document.querySelectorAll('.blog-card');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const vh = window.innerHeight;

        cards.forEach((card, i) => {
            const spacing = vh * 1.3;
            const cardStart = (vh * 1.5) + (i * spacing);
            const progress = (scrolled - cardStart) / vh;

            const z = (progress * 2800) - 800;

            const opacity = 1 - (progress * 1.3);
            const rotateY = progress * 25;
            const xDrift = Math.sin(progress * 2) * 40;

            if (z > -2500 && z < 2000) {
                card.style.display = 'flex';
                card.style.opacity = opacity > 0 ? opacity : 0;
                card.style.transform = `translate3d(${xDrift}px, 0, ${z}px) rotateY(${rotateY}deg)`;

                const blurValue = Math.abs(progress) > 0.6 ? (Math.abs(progress) * 8) : 0;
                card.style.filter = `blur(${blurValue}px)`;
            } else {
                card.style.display = 'none';
            }
        });
    });
}

/**
 * MODAL ENGINE
 */
function openArticle(post) {
    const modal = document.getElementById('article-modal');
    const bodyText = document.getElementById('modal-body');
    const mediaContainer = document.getElementById('modal-media-container');

    bodyText.innerHTML = "";

    const videoId = getYouTubeID(post.videoUrl);

    document.getElementById('modal-title').innerText = post.title;
    document.getElementById('modal-category').innerText = post.category;

    // Inject Video
    mediaContainer.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Render content instantly
    bodyText.textContent = post.content;
}

/**
 * MODAL UTILITIES
 */
function initModalLogic() {
    const modal = document.getElementById('article-modal');
    const closeBtn = document.getElementById('close-btn');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
        document.getElementById('modal-media-container').innerHTML = "";
        document.body.style.overflow = 'auto';
    };

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.getElementById('modal-media-container').innerHTML = "";
            document.body.style.overflow = 'auto';
        }
    };
}

// BOOT SYSTEM
window.onload = init;
