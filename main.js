/**
 * CLEMENT | Creative Technologist
 * Master 3D Engine: Offline JSON-File Architecture
 */

// 1. THE MANIFEST
// Add every filename you create in the /posts/ folder here.
const POST_FILES = [
    "post1.json",
    "introduction-and-strategic-framing-of-is.json"

];

let globalPosts = [];
let typingTimer;

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
 * Loads the JSON files and sets up the 3D World
 */
async function init() {
    console.log("System: Booting Archive...");

    const feed = document.getElementById('blog-feed');
    const scrollTrack = document.querySelector('.scroll-track');

    try {
        // Load every JSON file from the /posts/ folder
        const loadPromises = POST_FILES.map(async (file) => {
            const response = await fetch(`./posts/${file}`);
            if (!response.ok) throw new Error(`File not found: ${file}`);
            return await response.json();
        });

        globalPosts = await Promise.all(loadPromises);
        console.log("System: Data successfully decoded.", globalPosts);

        // 1. RENDER CARDS
        renderArticles(globalPosts);
        
        // 2. CALCULATE RUNWAY
        // We set the height of the page based on the number of articles.
        const totalHeight = (globalPosts.length * 120) + 120; 
        scrollTrack.style.height = `${totalHeight}vh`;

        // 3. START ENGINES
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
            // Spacing logic: cards appear sequentially
            const spacing = vh * 1.0; 
            const cardStart = (vh * 0.2) + (i * spacing);
            const progress = (scrolled - cardStart) / vh;

            // Z-Axis Transformation
            const z = (progress * 2800) - 1000; 
            
            // Visual modifiers
            const opacity = 1 - (progress * 1.3);
            const rotateY = progress * 25;
            const xDrift = Math.sin(progress * 2) * 40;

            if (z > -2500 && z < 2000) {
                card.style.display = 'flex'; // Ensure visible
                card.style.opacity = opacity > 0 ? opacity : 0;
                card.style.transform = `translate3d(${xDrift}px, 0, ${z}px) rotateY(${rotateY}deg)`;
                
                // Depth of field blur
                const blurValue = Math.abs(progress) > 0.6 ? (Math.abs(progress) * 8) : 0;
                card.style.filter = `blur(${blurValue}px)`;
            } else {
                card.style.display = 'none'; // Hide out-of-range for performance
            }
        });
    });
}

/**
 * MODAL & TYPEWRITER ENGINE
 */
function openArticle(post) {
    const modal = document.getElementById('article-modal');
    const bodyText = document.getElementById('modal-body');
    const mediaContainer = document.getElementById('modal-media-container');
    
    clearInterval(typingTimer);
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

    // TYPEWRITER EFFECT
    let charIndex = 0;
    bodyText.innerHTML = '<span id="typing-content"></span><span class="typewriter-cursor"></span>';
    const contentSpan = document.getElementById('typing-content');

    typingTimer = setInterval(() => {
        if (charIndex < post.content.length) {
            contentSpan.innerHTML += post.content.charAt(charIndex);
            charIndex++;
            const container = document.querySelector('.modal-container');
            container.scrollTop = container.scrollHeight;
        } else {
            clearInterval(typingTimer);
        }
    }, 18);
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
        clearInterval(typingTimer);
    };

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.getElementById('modal-media-container').innerHTML = "";
            document.body.style.overflow = 'auto';
            clearInterval(typingTimer);
        }
    };
}

// BOOT SYSTEM

window.onload = init;



