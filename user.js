// import for real time updates
import { onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
// When the page is loaded by user display their name and display recommendations
document.addEventListener('DOMContentLoaded', async () => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
        window.currentUser = JSON.parse(storedUser);
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) usernameDisplay.textContent = window.currentUser.username;

        const cachedRecs = localStorage.getItem('cachedRecommendations');
        if (cachedRecs) {
            displayRecommendations(JSON.parse(cachedRecs));
        }
        try {
            const recommendations = await getRecommendations();
            localStorage.setItem('cachedRecommendations', JSON.stringify(recommendations));
            displayRecommendations(recommendations);
        } catch (error) {
            const container = document.getElementById('recommendationList');
            if (container) container.innerHTML = '<p>Error loading recommendations. Please try again later.</p>';
        }

    } else {
        window.location.href = "index.html";
    }
});

// Get recommendations for the user
async function getRecommendations() {
    if (!window.currentUser || window.currentUser.isAdmin) return [];
    try {
        const db = window.db;
        const { getDocs, collection, doc, getDoc, query, where } = window.firestoreExports;

        // Get user's likes/dislikes from Firestore
        const userLikesRef = collection(db, "userLikes");
        const userLikesQuery = query(userLikesRef, where("username", "==", window.currentUser.username));
        const likesSnapshot = await getDocs(userLikesQuery);

        // If the user hasn't rated anything, show no recommendations
        if (likesSnapshot.empty) return [];

        // Get all rated itemids for all rated entries
        const ratedItemIds = likesSnapshot.docs.map(doc => doc.data().itemId);

        // Get user preferences
        const prefRef = doc(db, "userPreferences", window.currentUser.username);
        const prefSnapshot = await getDoc(prefRef);
        const userPrefs = prefSnapshot.exists() ? prefSnapshot.data() : {};

        // Get all items (entries)
        const [moviesSnap, showsSnap, gamesSnap] = await Promise.all([
            getDocs(collection(db, "movies")),
            getDocs(collection(db, "tvShows")),
            getDocs(collection(db, "videoGames"))
        ]);

        const allItems = [];
        moviesSnap.forEach(doc => allItems.push({ ...doc.data(), id: doc.id, type: 'movie' }));
        showsSnap.forEach(doc => allItems.push({ ...doc.data(), id: doc.id, type: 'show' }));
        gamesSnap.forEach(doc => allItems.push({ ...doc.data(), id: doc.id, type: 'game' }));

        // Filter out rated entries to not show
        const unratedItems = allItems.filter(item => !ratedItemIds.includes(item.id));
        if (unratedItems.length === 0) return [];

        // Score entries based on user preferences
        const scoredItems = unratedItems.map(item => {
            const genres = item.genres || [];
            let score = 0;
            genres.forEach(genre => {
                score += userPrefs[genre] || 0;
            });
            return { ...item, score };
        });

        // Only recommend entries with a score > 0
        const filtered = scoredItems.filter(item => item.score > 0);

        // If none have score > 0, show the top 3 unrated items
        if (filtered.length > 0) {
            return filtered.sort((a, b) => b.score - a.score).slice(0, 3);
        } else {
            return scoredItems.sort((a, b) => b.score - a.score).slice(0, 3);
        }
    } catch (error) {
        console.error("Error getting recommendations:", error);
        return [];
    }
}
window.getRecommendations = getRecommendations;

// Display recommendations
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationList');
    if (!container) return;

    container.innerHTML = '';

    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = '<p>No recommendations yet. Like some items to get personalized recommendations!</p>';
        return;
    }

    // Create a <ul> to hold the recommendations
    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.padding = "0";
    ul.style.margin = "0";

    recommendations.forEach(item => {
        // Use a temporary <ul> to get the <li> from the display functions
        const tempUl = document.createElement("ul");
        if (item.type === 'movie' && window.displayMovieItem) {
            window.displayMovieItem(item.id, item, tempUl);
        } else if (item.type === 'show' && window.displayTvShowItem) {
            window.displayTvShowItem(item.id, item, tempUl);
        } else if (item.type === 'game' && window.displayVideoGameItem) {
            window.displayVideoGameItem(item.id, item, tempUl);
        }
        // Move the generated <li> into the recommendations <ul>
        if (tempUl.firstChild) {
            tempUl.firstChild.classList.add('recommendation-item');
            tempUl.firstChild.setAttribute('data-id', item.id);
            ul.appendChild(tempUl.firstChild);
        }
    });

    container.appendChild(ul);
}
window.displayRecommendations = displayRecommendations;
