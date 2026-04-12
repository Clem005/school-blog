/**
 * CLEMENT | Creative Technologist
 * Master 3D Engine: Instant Text & Tight Scroll Edition
 */

// 1. THE MANIFEST
// Add your JSON filenames here exactly as they appear in the /posts/ folder
const POST_FILES = [
    "post1.json",
    "post2.json",
    "post3.json"
];

let globalPosts = [];

/**
 * YouTube ID Extractor
 * Parses YouTube URLs to get the unique 11-character ID
 */
function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "dQw4w9WgXcQ";
}

/**
 * INITIALIZATION
 * Loads JSONs and prepares the 3D environment
 */
async function init() {
    console.log("System: Synchronizing Archive...");

    const scrollTrack = document.querySelector('.scroll-track');

    try {
        // Load every JSON file from the /posts/ folder
        const loadPromises = POST_FILES.map(async (file) => {
            const response = await fetch(`posts/${file}`);
            if (!response.ok) throw new Error(`File not found: ${file}`);
            return await response.json();
        });

        globalPosts = await Promise.all(loadPromises);
        
        // 1. RENDER CARDS
        renderArticles(globalPosts);
        
        // 2. TIGHTEN SCROLL TRACK
        // Calculates height based on post count to prevent "dead air" at the end
        const totalHeight = (globalPosts.length * 110) + 120; 
        scrollTrack.style.height = `${totalHeight}vh`;

        // 3. START ENGINES
        init3DScroll();
        initModalLogic();

    } catch (err) {
        console.error("Initialization Failed:", err.message);
    }
}

/**
 * RENDER ARTICLES
 * Builds the cards with YouTube thumbnails
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
                    <div style="margin-top:20px; font-size: 0.6rem; letter-spacing: 2px; color: #666;">VIEW ENTRY +</div>
                </div>
            </div>
        `;
    }).join('');

    // Click Delegation
    feed.onclick = (e) => {
        const card = e.target.closest('.blog-card');
        if (card) {
            const index = card.getAttribute('data-index');
            openArticle(globalPosts[index]);
        }
    };
}

/**
 * 3D SCROLL ENGINE (REDUCED SPACE FIX)
 * Moves cards through the Z-axis with zero "dead space"
 */
function init3DScroll() {
    const cards = document.querySelectorAll('.blog-card');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const vh = window.innerHeight;

        cards.forEach((card, i) => {
            const spacing = vh * 1.1; 
            
            // REDUCED SPACE FIX: 
            // We changed vh * 1.5 to vh * 0.1 to make cards start 
            // immediately after the history section.
            const cardStart = (vh * 0.1) + (i * spacing);
            const progress = (scrolled - cardStart) / vh;

            // Z-axis transformation
            const z = (progress * 2800) - 1000; 
            const opacity = 1 - (progress * 1.3);
            const rotateY = progress * 20;

            if (z > -2500 && z < 2000) {
                card.style.display = 'flex';
                card.style.opacity = opacity > 0 ? opacity : 0;
                card.style.transform = `translate3d(0, 0, ${z}px) rotateY(${rotateY}deg)`;
                
                // Keep cards sharp for longer
                const blur = Math.abs(progress) > 0.7 ? (Math.abs(progress) * 8) : 0;
                card.style.filter = `blur(${blur}px)`;
            } else {
                card.style.display = 'none';
            }
        });
    });
}

/**
 * MODAL LOGIC (INSTANT TEXT FIX)
 */
function openArticle(post) {
    const modal = document.getElementById('article-modal');
    const bodyText = document.getElementById('modal-body');
    const mediaContainer = document.getElementById('modal-media-container');
    
    const videoId = getYouTubeID(post.videoUrl);

    document.getElementById('modal-title').innerText = post.title;
    document.getElementById('modal-category').innerText = post.category;
    
    // Inject Video Player
    mediaContainer.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;

    // INSTANT TEXT FIX:
    // No more typewriter loops. Set the full content immediately.
    bodyText.innerText = post.content;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
}

/**
 * CLOSE MODAL UTILS
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

// BOOT
window.onload = init;
